// API: GET /api/repos/[repoId] - Get repo details

import { NextResponse } from 'next/server';
import { getRepo } from '@/lib/db';

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

    return NextResponse.json({ repo });
  } catch (error) {
    console.error('[API] Error fetching repo:', error);
    return NextResponse.json({ error: 'Failed to fetch repo' }, { status: 500 });
  }
}
