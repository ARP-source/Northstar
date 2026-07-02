// API: GET /api/repos/[repoId]/pushes/[pushId] - Get push details and analysis

import { NextResponse } from 'next/server';
import { getPush, getAnalysis } from '@/lib/db';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ repoId: string; pushId: string }> }
) {
  try {
    const { pushId } = await params;
    const push = await getPush(pushId);
    
    if (!push) {
      return NextResponse.json({ error: 'Push not found' }, { status: 404 });
    }

    const analysis = await getAnalysis(pushId);
    
    return NextResponse.json({ push, analysis });
  } catch (error) {
    console.error('[API] Error fetching push details:', error);
    return NextResponse.json({ error: 'Failed to fetch push details' }, { status: 500 });
  }
}
