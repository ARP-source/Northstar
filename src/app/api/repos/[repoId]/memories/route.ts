// API: GET /api/repos/[repoId]/memories - List memories
// API: POST /api/repos/[repoId]/memories - Create memory

import { NextResponse } from 'next/server';
import { getMemories, createMemory } from '@/lib/db';
import { v4 as uuid } from 'uuid';
import type { Memory, MemoryCategory, MemoryStatus } from '@/lib/types/memory';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ repoId: string }> }
) {
  try {
    const { repoId } = await params;
    const url = new URL(request.url);
    const category = url.searchParams.get('category') || undefined;
    const status = url.searchParams.get('status') || undefined;

    const memories = await getMemories(repoId, { category, status });
    return NextResponse.json({ memories });
  } catch (error) {
    console.error('[API] Error fetching memories:', error);
    return NextResponse.json({ error: 'Failed to fetch memories' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ repoId: string }> }
) {
  try {
    const { repoId } = await params;
    const body = await request.json();

    const memory: Memory = {
      id: uuid(),
      repoId,
      category: body.category as MemoryCategory,
      statement: body.statement,
      evidence: body.evidence || '',
      relatedFiles: body.relatedFiles || [],
      relatedModules: body.relatedModules || [],
      confidenceScore: body.confidenceScore || 0.5,
      importanceScore: body.importanceScore || 0.5,
      status: (body.status as MemoryStatus) || 'active',
      supersedesMemoryId: body.supersedesMemoryId || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await createMemory(memory);
    return NextResponse.json({ memory }, { status: 201 });
  } catch (error) {
    console.error('[API] Error creating memory:', error);
    return NextResponse.json({ error: 'Failed to create memory' }, { status: 500 });
  }
}
