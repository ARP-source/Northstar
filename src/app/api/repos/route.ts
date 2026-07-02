// API: GET /api/repos - List all repos
// API: POST /api/repos - Connect a new repo

import { NextResponse } from 'next/server';
import { getRepos, createRepo } from '@/lib/db';
import { v4 as uuid } from 'uuid';
import type { Repo } from '@/lib/types/repo';

export async function GET() {
  try {
    const repos = await getRepos();
    return NextResponse.json({ repos });
  } catch (error) {
    console.error('[API] Error fetching repos:', error);
    return NextResponse.json({ error: 'Failed to fetch repos' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { githubUrl } = body;

    if (!githubUrl) {
      return NextResponse.json({ error: 'githubUrl is required' }, { status: 400 });
    }

    // Parse GitHub URL
    const urlMatch = githubUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!urlMatch) {
      return NextResponse.json({ error: 'Invalid GitHub URL' }, { status: 400 });
    }

    const [, owner, name] = urlMatch;

    const repo: Repo = {
      id: uuid(),
      githubUrl,
      owner,
      name: name.replace(/\.git$/, ''),
      defaultBranch: 'main',
      northStar: null,
      architectureSummary: null,
      alignmentScore: 50,
      driftScore: 0,
      hallucinationRiskScore: 0,
      architectureConsistencyScore: 100,
      confidenceScore: 0,
      lastAnalyzedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await createRepo(repo);
    return NextResponse.json({ repo }, { status: 201 });
  } catch (error) {
    console.error('[API] Error creating repo:', error);
    return NextResponse.json({ error: 'Failed to create repo' }, { status: 500 });
  }
}
