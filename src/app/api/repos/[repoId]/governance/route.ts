// API: GET /api/repos/[repoId]/governance - Get governance rules
// API: PUT /api/repos/[repoId]/governance - Update governance rules

import { NextResponse } from 'next/server';
import { getGovernanceRules, upsertGovernanceRules } from '@/lib/db';
import { v4 as uuid } from 'uuid';
import type { GovernanceRule } from '@/lib/types/governance';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ repoId: string }> }
) {
  try {
    const { repoId } = await params;
    const rules = await getGovernanceRules(repoId);
    return NextResponse.json({ rules });
  } catch (error) {
    console.error('[API] Error fetching governance rules:', error);
    return NextResponse.json({ error: 'Failed to fetch governance rules' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ repoId: string }> }
) {
  try {
    const { repoId } = await params;
    const body = await request.json();
    const rulesToUpdate = Array.isArray(body) ? body : body.rules;
    
    if (!Array.isArray(rulesToUpdate)) {
      return NextResponse.json({ error: 'Invalid input format, expected array of rules' }, { status: 400 });
    }

    const rules: GovernanceRule[] = rulesToUpdate.map((r: any) => ({
      id: r.id || uuid(),
      repoId,
      ruleType: r.ruleType,
      title: r.title,
      description: r.description,
      priority: r.priority,
      active: r.active !== undefined ? r.active : true,
      createdAt: r.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    const updatedRules = await upsertGovernanceRules(repoId, rules);
    return NextResponse.json({ rules: updatedRules });
  } catch (error) {
    console.error('[API] Error updating governance rules:', error);
    return NextResponse.json({ error: 'Failed to update governance rules' }, { status: 500 });
  }
}
