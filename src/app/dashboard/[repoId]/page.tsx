"use client";

import { use, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { formatRelativeTime, scoreColor, scoreBgColor } from '@/lib/utils';
import { seedData } from '@/lib/db/seed';
import type { Repo } from '@/lib/types/repo';
import type { PushAnalysis } from '@/lib/types/push';
import { VERDICT_CONFIG } from '@/lib/types/push';
import { SCORE_CONFIG } from '@/lib/types/scores';
import Link from 'next/link';

export default function DashboardOverview({ params }: { params: Promise<{ repoId: string }> }) {
  const { repoId } = use(params);
  
  // Use seed data directly for demo reliability
  const repo = seedData.repos.find(r => r.id === repoId) || seedData.repos[0];
  const analyses = seedData.pushAnalyses.filter(a => a.repoId === repoId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const recentAnalyses = analyses.slice(0, 3);

  const scores = [
    { key: 'alignmentScore', val: repo.alignmentScore },
    { key: 'driftScore', val: repo.driftScore },
    { key: 'hallucinationRiskScore', val: repo.hallucinationRiskScore },
    { key: 'architectureConsistencyScore', val: repo.architectureConsistencyScore },
    { key: 'confidenceScore', val: repo.confidenceScore },
  ] as const;

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-1 text-zinc-100">Project Overview</h1>
        <p className="text-zinc-400">High-level health and recent activity for {repo.owner}/{repo.name}</p>
      </div>

      {/* Score Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {scores.map(({ key, val }) => {
          const config = SCORE_CONFIG[key];
          const colorClass = config.color(val);
          return (
            <Card key={key} className="bg-zinc-900/40 border-zinc-800/60 shadow-none">
              <CardContent className="p-5 flex flex-col justify-between h-full">
                <div>
                  <div className="text-xs font-medium text-zinc-400 mb-2">{config.label}</div>
                  <div className={`text-3xl font-bold mb-4 ${colorClass}`}>
                    {val}
                  </div>
                </div>
                <Progress 
                  value={config.invertedScale ? 100 - val : val} 
                  className="h-1.5 bg-zinc-800" 
                  indicatorClassName={config.invertedScale ? "bg-amber-400" : "bg-emerald-400"} 
                />
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          {/* Mission Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Project Mission (North Star)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-zinc-300 leading-relaxed text-lg">
                {repo.northStar || "No north star defined yet. NorthStar is ingesting the repo..."}
              </p>
            </CardContent>
          </Card>

          {/* Recent Pushes */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>Recent Pushes</CardTitle>
                <CardDescription>Latest code changes analyzed by NorthStar</CardDescription>
              </div>
              <Link href={`/dashboard/${repoId}/pushes`} className="text-sm text-emerald-400 hover:underline">
                View all
              </Link>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-4">
                {recentAnalyses.map((analysis) => {
                  const push = seedData.pushes.find(p => p.id === analysis.pushId)!;
                  const verdictCfg = VERDICT_CONFIG[analysis.verdict];
                  return (
                    <Link key={analysis.id} href={`/dashboard/${repoId}/pushes/${push.id}`}>
                      <div className="group block p-4 rounded-xl border border-zinc-800/50 bg-zinc-900/30 hover:bg-zinc-800/50 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-3">
                            <Badge className={verdictCfg.color}>
                              <span className="mr-1">{verdictCfg.icon}</span>
                              {verdictCfg.label}
                            </Badge>
                            <span className="text-sm font-medium text-zinc-300 truncate max-w-sm">
                              {push.commitMessage.split('\\n')[0]}
                            </span>
                          </div>
                          <span className="text-xs text-zinc-500 whitespace-nowrap ml-4">
                            {formatRelativeTime(push.receivedAt)}
                          </span>
                        </div>
                        <div className="text-sm text-zinc-400 line-clamp-2 mt-2">
                          {analysis.intentSummary}
                        </div>
                        <div className="flex gap-4 mt-4 text-xs font-medium">
                          <span className={scoreColor(analysis.alignmentScore)}>Align: {analysis.alignmentScore}</span>
                          <span className={scoreColor(analysis.driftScore, true)}>Drift: {analysis.driftScore}</span>
                          <span className="text-zinc-500">{push.filesChanged.length} files changed</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          {/* Architecture Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Architecture</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-zinc-400 leading-relaxed">
                {repo.architectureSummary || "No architecture summary generated yet."}
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-6">
              <div className="text-center space-y-2">
                <h3 className="font-semibold text-zinc-100">Need to trigger a scan?</h3>
                <p className="text-sm text-zinc-400 text-balance mb-4">In production, this happens automatically via GitHub Webhooks on every push to main or opened PR.</p>
                <div className="text-xs text-zinc-500 border border-zinc-800 bg-zinc-950 rounded p-2 font-mono">
                  POST /api/webhooks/github
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
