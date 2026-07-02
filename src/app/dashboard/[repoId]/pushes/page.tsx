"use client";

import { use } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatRelativeTime } from '@/lib/utils';
import { seedData } from '@/lib/db/seed';
import { VERDICT_CONFIG, CHANGE_TYPE_LABELS } from '@/lib/types/push';

export default function PushesListPage({ params }: { params: Promise<{ repoId: string }> }) {
  const { repoId } = use(params);
  
  const pushes = seedData.pushes.filter(p => p.repoId === repoId).sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime());

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-1 text-zinc-100">Push History</h1>
        <p className="text-zinc-400">All analyzed code changes for this repository.</p>
      </div>

      <div className="space-y-4">
        {pushes.map(push => {
          const analysis = seedData.pushAnalyses.find(a => a.pushId === push.id);
          const verdictCfg = analysis ? VERDICT_CONFIG[analysis.verdict] : null;
          
          return (
            <Link key={push.id} href={`/dashboard/${repoId}/pushes/${push.id}`}>
              <Card className="hover:bg-zinc-800/50 transition-colors cursor-pointer border-zinc-800">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs text-zinc-500 bg-zinc-950 px-2 py-1 rounded">
                          {push.commitSha.substring(0, 7)}
                        </span>
                        <h3 className="font-semibold text-zinc-100 text-lg">
                          {push.commitMessage.split('\\n')[0]}
                        </h3>
                      </div>
                      
                      {analysis && (
                        <p className="text-sm text-zinc-400 line-clamp-2 pr-8">
                          {analysis.intentSummary}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 text-xs text-zinc-500">
                        <span>by {push.author}</span>
                        <span>branch: {push.branch}</span>
                        <span>{formatRelativeTime(push.receivedAt)}</span>
                        <span>{push.filesChanged.length} files changed</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-3 min-w-[200px]">
                      {verdictCfg ? (
                        <Badge className={`${verdictCfg.color} px-3 py-1 text-sm`}>
                          <span className="mr-2">{verdictCfg.icon}</span>
                          {verdictCfg.label}
                        </Badge>
                      ) : (
                        <Badge variant="outline">Pending Analysis</Badge>
                      )}
                      
                      {analysis && (
                        <div className="flex gap-2">
                          <Badge variant="outline" className="bg-zinc-950/50">
                            Align: {analysis.alignmentScore}
                          </Badge>
                          <Badge variant="outline" className="bg-zinc-950/50">
                            Drift: {analysis.driftScore}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
