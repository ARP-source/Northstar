// API: GET /api/repos/[repoId]/timeline - Get timeline events

import { NextResponse } from 'next/server';
import { getTimelineEvents } from '@/lib/db';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ repoId: string }> }
) {
  try {
    const { repoId } = await params;
    const timelineEvents = await getTimelineEvents(repoId);
    return NextResponse.json({ timelineEvents });
  } catch (error) {
    console.error('[API] Error fetching timeline events:', error);
    return NextResponse.json({ error: 'Failed to fetch timeline events' }, { status: 500 });
  }
}
