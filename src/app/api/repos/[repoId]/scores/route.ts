// API: GET /api/repos/[repoId]/scores - Get current repo scores

import { NextResponse } from 'next/server';
import { getRepo } from '@/lib/db';
import type { Scores } from '@/lib/types/scores';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ repoId: string }> }
) {
  try {
    const { repoId } = await params;
    const repo = await getRepo(repoId);
    
    if (!repo) {
      return NextResponse.json({ error: 'Repo not found' }, { status: 404 });
    }

    const scores: Scores = {
      alignmentScore: repo.alignmentScore,
      driftScore: repo.driftScore,
      hallucinationRiskScore: repo.hallucinationRiskScore,
      architectureConsistencyScore: repo.architectureConsistencyScore,
      confidenceScore: repo.confidenceScore,
    };

    return NextResponse.json({ scores });
  } catch (error) {
    console.error('[API] Error fetching scores:', error);
    return NextResponse.json({ error: 'Failed to fetch scores' }, { status: 500 });
  }
}
