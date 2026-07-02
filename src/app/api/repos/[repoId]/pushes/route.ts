// API: GET /api/repos/[repoId]/pushes - List pushes for a repo

import { NextResponse } from 'next/server';
import { getPushes } from '@/lib/db';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ repoId: string }> }
) {
  try {
    const { repoId } = await params;
    const pushes = await getPushes(repoId);
    return NextResponse.json({ pushes });
  } catch (error) {
    console.error('[API] Error fetching pushes:', error);
    return NextResponse.json({ error: 'Failed to fetch pushes' }, { status: 500 });
  }
}
