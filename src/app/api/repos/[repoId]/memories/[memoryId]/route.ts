// API: PATCH /api/repos/[repoId]/memories/[memoryId] - Update memory
// API: DELETE /api/repos/[repoId]/memories/[memoryId] - Archive memory

import { NextResponse } from 'next/server';
import { updateMemory, archiveMemories } from '@/lib/db';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ repoId: string; memoryId: string }> }
) {
  try {
    const { memoryId } = await params;
    const body = await request.json();

    const updated = await updateMemory(memoryId, body);
    if (!updated) {
      return NextResponse.json({ error: 'Memory not found' }, { status: 404 });
    }

    return NextResponse.json({ memory: updated });
  } catch (error) {
    console.error('[API] Error updating memory:', error);
    return NextResponse.json({ error: 'Failed to update memory' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ repoId: string; memoryId: string }> }
) {
  try {
    const { memoryId } = await params;
    await archiveMemories([memoryId]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] Error archiving memory:', error);
    return NextResponse.json({ error: 'Failed to archive memory' }, { status: 500 });
  }
}
