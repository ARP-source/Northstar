// Qwen Cloud client wrapper for NorthStar
// Uses OpenAI SDK pointed at DashScope-compatible endpoint

import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

// ── Model constants ────────────────────────────────────────────────────────────
export const QWEN_PLUS = 'qwen-plus' as const;
export const QWEN_TURBO = 'qwen-turbo' as const;
export const QWEN_EMBEDDING = 'text-embedding-v3' as const;

const EMBEDDING_DIMENSIONS = 1024;

// ── Client singleton ───────────────────────────────────────────────────────────
let _client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!_client) {
    const apiKey = process.env.QWEN_API_KEY;
    if (!apiKey) {
      throw new Error('QWEN_API_KEY environment variable is not set');
    }
    _client = new OpenAI({
      apiKey,
      baseURL: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1',
    });
  }
  return _client;
}

// ── Types ──────────────────────────────────────────────────────────────────────
export interface ChatCompletionOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stop?: string[];
}

// ── Chat Completion ────────────────────────────────────────────────────────────
/**
 * General-purpose chat completion. Returns the assistant's text content or null on failure.
 */
export async function chatCompletion(
  model: string,
  messages: ChatCompletionMessageParam[],
  options?: ChatCompletionOptions,
): Promise<string | null> {
  try {
    const client = getClient();
    const response = await client.chat.completions.create({
      model,
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 4096,
      top_p: options?.topP ?? 0.9,
      ...(options?.stop ? { stop: options.stop } : {}),
    });
    return response.choices[0]?.message?.content ?? null;
  } catch (error) {
    console.error('[qwen] chatCompletion error:', error instanceof Error ? error.message : error);
    return null;
  }
}

// ── JSON Structured Completion ─────────────────────────────────────────────────
/**
 * Chat completion that returns parsed JSON of type T.
 * Injects 'JSON' into the system prompt if not already present (Qwen requirement).
 * Uses response_format: { type: 'json_object' } for reliable structured output.
 */
export async function jsonCompletion<T>(
  model: string,
  messages: ChatCompletionMessageParam[],
  schemaDescription: string,
  options?: ChatCompletionOptions,
): Promise<T> {
  try {
    const client = getClient();

    // Ensure the system prompt mentions JSON (required by Qwen for json_object mode)
    const hasSystemPrompt = messages.some((m) => m.role === 'system');
    if (!hasSystemPrompt) {
      messages.unshift({ role: 'system', content: 'Output MUST be in valid JSON format.' });
    } else {
      const sysMsg = messages.find((m) => m.role === 'system');
      if (sysMsg && typeof sysMsg.content === 'string' && !sysMsg.content.includes('JSON')) {
        sysMsg.content += '\n\nOutput MUST be in valid JSON format.';
      }
    }

    const response = await client.chat.completions.create({
      model,
      messages,
      response_format: { type: 'json_object' },
      temperature: 0.1, // Low temp for more consistent structured outputs
      ...options,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('[qwen] jsonCompletion: empty response');
    }

    // Parse and return typed result
    const parsed = JSON.parse(content) as T;
    return parsed;
  } catch (error) {
    console.error('[qwen] jsonCompletion error:', error instanceof Error ? error.message : error);
    throw error;
  }
}

// ── Embedding Generation ───────────────────────────────────────────────────────
/**
 * Generate a vector embedding for the given text using text-embedding-v3.
 * Returns a 1024-dimensional float array or null on failure.
 */
export async function generateEmbedding(text: string): Promise<number[] | null> {
  try {
    const client = getClient();

    // Truncate excessively long text to avoid token limits (rough heuristic: ~8000 tokens ≈ 32k chars)
    const truncated = text.length > 32000 ? text.slice(0, 32000) : text;

    const response = await client.embeddings.create({
      model: QWEN_EMBEDDING,
      input: truncated,
      dimensions: EMBEDDING_DIMENSIONS,
    });

    return response.data[0]?.embedding ?? null;
  } catch (error) {
    console.error('[qwen] generateEmbedding error:', error instanceof Error ? error.message : error);
    return null;
  }
}

// ── Batch Embedding Generation ─────────────────────────────────────────────────
/**
 * Generate embeddings for multiple texts in a single API call.
 * Returns array of 1024-dim vectors or null on failure.
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][] | null> {
  try {
    if (texts.length === 0) return [];

    const client = getClient();
    const truncated = texts.map((t) => (t.length > 32000 ? t.slice(0, 32000) : t));

    const response = await client.embeddings.create({
      model: QWEN_EMBEDDING,
      input: truncated,
      dimensions: EMBEDDING_DIMENSIONS,
    });

    // Sort by index to preserve order
    const sorted = response.data.sort((a, b) => a.index - b.index);
    return sorted.map((d) => d.embedding);
  } catch (error) {
    console.error('[qwen] generateEmbeddings error:', error instanceof Error ? error.message : error);
    return null;
  }
}

// ── Test Connection ────────────────────────────────────────────────────────────
/**
 * Quick connectivity test. Returns true if the Qwen API responds, false otherwise.
 */
export async function testConnection(): Promise<{ ok: boolean; model: string; latencyMs: number; error?: string }> {
  const start = Date.now();
  try {
    const result = await chatCompletion(
      QWEN_TURBO,
      [
        { role: 'system', content: 'You are a test assistant. Reply with exactly: PONG' },
        { role: 'user', content: 'PING' },
      ],
      { temperature: 0, maxTokens: 16 },
    );

    const latencyMs = Date.now() - start;
    if (result && result.includes('PONG')) {
      return { ok: true, model: QWEN_TURBO, latencyMs };
    }
    return { ok: false, model: QWEN_TURBO, latencyMs, error: `Unexpected response: ${result}` };
  } catch (error) {
    return {
      ok: false,
      model: QWEN_TURBO,
      latencyMs: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
