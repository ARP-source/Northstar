// Scoring engine — aggregates push analysis scores into repo-level scores
import type { PushAnalysis } from '@/lib/types';
import type { Scores } from '@/lib/types/scores';

/**
 * Default scores for repos with no analysis history.
 */
export const DEFAULT_SCORES: Scores = {
  alignmentScore: 75,
  driftScore: 10,
  hallucinationRiskScore: 10,
  architectureConsistencyScore: 80,
  confidenceScore: 20,
};

/**
 * Computes aggregate repo-level scores from recent push analyses.
 *
 * Strategy:
 * - Alignment: weighted average with recency bias
 * - Drift: exponential moving average favoring recent pushes
 * - Hallucination: max of recent + weighted average (cautious)
 * - Architecture: minimum of recent + weighted average (cautious)
 * - Confidence: based on evidence count and analysis volume
 *
 * @param repoId - The repository ID
 * @param recentAnalyses - Recent push analyses, ordered newest first
 */
export function computeRepoScores(
  repoId: string,
  recentAnalyses: PushAnalysis[]
): Scores {
  console.log(`[scoring] Computing scores for repo ${repoId} from ${recentAnalyses.length} analyses`);

  if (recentAnalyses.length === 0) {
    console.log(`[scoring] No analyses available — returning defaults`);
    return { ...DEFAULT_SCORES };
  }

  // Ensure analyses are sorted newest first
  const sorted = [...recentAnalyses].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const alignmentScore = computeWeightedAverage(
    sorted.map(a => a.alignmentScore),
    buildRecencyWeights(sorted.length)
  );

  const driftScore = computeExponentialMovingAverage(
    sorted.map(a => a.driftScore)
  );

  const hallucinationRiskScore = computeHallucinationAggregate(
    sorted.map(a => a.hallucinationRiskScore)
  );

  const architectureConsistencyScore = computeArchitectureAggregate(
    sorted.map(a => a.architectureConsistencyScore)
  );

  const confidenceScore = computeConfidence(sorted);

  const scores: Scores = {
    alignmentScore: clamp(Math.round(alignmentScore), 0, 100),
    driftScore: clamp(Math.round(driftScore), 0, 100),
    hallucinationRiskScore: clamp(Math.round(hallucinationRiskScore), 0, 100),
    architectureConsistencyScore: clamp(Math.round(architectureConsistencyScore), 0, 100),
    confidenceScore: clamp(Math.round(confidenceScore), 0, 100),
  };

  console.log(`[scoring] Computed scores for repo ${repoId}:`, scores);

  return scores;
}

// ── Individual Score Computation Helpers ──────────────────────────────────────

/**
 * Builds recency weights where more recent analyses have higher weight.
 * Uses exponential decay: weight_i = decay^i
 */
export function buildRecencyWeights(count: number, decay: number = 0.8): number[] {
  const weights: number[] = [];
  for (let i = 0; i < count; i++) {
    weights.push(Math.pow(decay, i));
  }
  return weights;
}

/**
 * Computes a weighted average of values using the given weights.
 */
export function computeWeightedAverage(values: number[], weights: number[]): number {
  if (values.length === 0) return 0;

  let weightedSum = 0;
  let totalWeight = 0;

  for (let i = 0; i < values.length; i++) {
    const weight = weights[i] ?? weights[weights.length - 1] ?? 1;
    weightedSum += values[i] * weight;
    totalWeight += weight;
  }

  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}

/**
 * Exponential Moving Average — gives much more weight to recent values.
 * Good for drift detection where recent trends matter most.
 *
 * EMA formula: EMA_t = α * value_t + (1-α) * EMA_{t-1}
 */
export function computeExponentialMovingAverage(
  values: number[],
  alpha: number = 0.3
): number {
  if (values.length === 0) return 0;
  if (values.length === 1) return values[0];

  // Process from oldest to newest for correct EMA
  const reversed = [...values].reverse();
  let ema = reversed[0];

  for (let i = 1; i < reversed.length; i++) {
    ema = alpha * reversed[i] + (1 - alpha) * ema;
  }

  return ema;
}

/**
 * Hallucination aggregate: blend of max (cautious) and weighted average.
 * We want to surface high-risk signals even if most pushes are clean.
 *
 * Formula: 0.4 * max(recent_5) + 0.6 * weighted_avg(all)
 */
export function computeHallucinationAggregate(scores: number[]): number {
  if (scores.length === 0) return 0;

  const recentSlice = scores.slice(0, 5);
  const maxRecent = Math.max(...recentSlice);
  const weightedAvg = computeWeightedAverage(scores, buildRecencyWeights(scores.length));

  return (0.4 * maxRecent) + (0.6 * weightedAvg);
}

/**
 * Architecture aggregate: blend of minimum (cautious) and weighted average.
 * We want to surface architecture concerns even if most pushes are clean.
 *
 * Formula: 0.3 * min(recent_5) + 0.7 * weighted_avg(all)
 */
export function computeArchitectureAggregate(scores: number[]): number {
  if (scores.length === 0) return 0;

  const recentSlice = scores.slice(0, 5);
  const minRecent = Math.min(...recentSlice);
  const weightedAvg = computeWeightedAverage(scores, buildRecencyWeights(scores.length));

  return (0.3 * minRecent) + (0.7 * weightedAvg);
}

/**
 * Confidence score based on:
 * - Number of analyses (more = higher confidence)
 * - Average confidence of individual analyses
 * - Consistency of scores across analyses (lower variance = higher confidence)
 */
export function computeConfidence(analyses: PushAnalysis[]): number {
  if (analyses.length === 0) return 10;

  // Factor 1: Volume of analyses (logarithmic, caps around 20 analyses)
  const volumeFactor = Math.min(1, Math.log(analyses.length + 1) / Math.log(21));

  // Factor 2: Average confidence of individual analyses
  const avgConfidence = analyses.reduce((sum, a) => sum + a.confidenceScore, 0) / analyses.length;
  const confidenceFactor = avgConfidence / 100;

  // Factor 3: Score consistency (low variance = high confidence)
  const alignmentScores = analyses.map(a => a.alignmentScore);
  const variance = computeVariance(alignmentScores);
  const maxExpectedVariance = 2500; // variance of scores ranging 0-100
  const consistencyFactor = 1 - Math.min(1, variance / maxExpectedVariance);

  // Weighted combination
  const confidence = (
    (volumeFactor * 0.3) +
    (confidenceFactor * 0.5) +
    (consistencyFactor * 0.2)
  ) * 100;

  return confidence;
}

/**
 * Computes variance of a number array.
 */
function computeVariance(values: number[]): number {
  if (values.length <= 1) return 0;
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  return values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / values.length;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
