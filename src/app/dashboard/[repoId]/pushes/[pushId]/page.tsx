"use client";

import { use } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Brain } from 'lucide-react';
import { formatRelativeTime, scoreColor } from '@/lib/utils';
import { seedData } from '@/lib/db/seed';
import { VERDICT_CONFIG, CHANGE_TYPE_LABELS } from '@/lib/types/push';
import { CATEGORY_COLORS, CATEGORY_LABELS } from '@/lib/types/memory';

export default function PushDetailPage({ params }: { params: Promise<{ repoId: string; pushId: string }> }) {
  const { repoId, pushId } = use(params);
  
  const push = seedData.pushes.find(p => p.id === pushId);
  const analysis = seedData.pushAnalyses.find(a => a.pushId === pushId);
  
  if (!push || !analysis) {
    return <div>Push not found or analysis pending.</div>;
  }

  const verdictCfg = VERDICT_CONFIG[analysis.verdict];
  
  const scores = [
    { label: 'Alignment', val: analysis.alignmentScore, invert: false },
    { label: 'Drift', val: analysis.driftScore, invert: true },
    { label: 'Hallucination', val: analysis.hallucinationRiskScore, invert: true },
    { label: 'Architecture', val: analysis.architectureConsistencyScore, invert: false },
    { label: 'Confidence', val: analysis.confidenceScore, invert: false },
  ];

  return (
    <div className="space-y-6 max-w-6xl pb-20">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <span className="font-mono text-sm text-zinc-400 bg-zinc-900 px-2 py-1 rounded">
            {push.commitSha.substring(0, 7)}
          </span>
          <span className="text-zinc-500 text-sm">
            pushed by <span className="font-medium text-zinc-300">{push.author}</span> to <span className="font-medium text-zinc-300">{push.branch}</span> {formatRelativeTime(push.receivedAt)}
          </span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">{push.commitMessage.split('\\n')[0]}</h1>
      </div>

      {/* Verdict Banner */}
      <div className={`rounded-xl p-6 border ${verdictCfg.color} flex items-center justify-between`}>
        <div className="flex items-center gap-4">
          <div className="text-4xl">{verdictCfg.icon}</div>
          <div>
            <h2 className="text-2xl font-bold">{verdictCfg.label}</h2>
            <p className="opacity-80 mt-1">Change Type: {CHANGE_TYPE_LABELS[analysis.changeType]}</p>
          </div>
        </div>
      </div>

      {/* Scores */}
      <div className="grid grid-cols-5 gap-4">
        {scores.map(s => (
          <Card key={s.label} className="bg-zinc-900/40 border-zinc-800/60 shadow-none">
            <CardContent className="p-4 text-center">
              <div className="text-xs text-zinc-400 mb-1">{s.label}</div>
              <div className={`text-2xl font-bold ${scoreColor(s.val, s.invert)}`}>{s.val}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="analysis" className="mt-8">
        <TabsList className="grid grid-cols-5 bg-zinc-900/50">
          <TabsTrigger value="analysis">Analysis & Explanation</TabsTrigger>
          <TabsTrigger value="drift">
            Drift Findings 
            {analysis.driftFindings.length > 0 && <Badge variant="destructive" className="ml-2 bg-red-500 text-white rounded-full px-1.5 py-0 min-w-[20px]">{analysis.driftFindings.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="hallucination">
            Hallucination
            {analysis.hallucinationFindings.length > 0 && <Badge variant="destructive" className="ml-2 bg-red-500 text-white rounded-full px-1.5 py-0 min-w-[20px]">{analysis.hallucinationFindings.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="memories">Recalled Memories</TabsTrigger>
          <TabsTrigger value="files">Files ({push.filesChanged.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="analysis" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Intent Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-zinc-300 leading-relaxed">{analysis.intentSummary}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Explanation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-invert max-w-none text-zinc-300">
                {analysis.explanation.split('\\n\\n').map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </CardContent>
          </Card>
          {analysis.prComment && (
            <Card>
              <CardHeader>
                <CardTitle>Generated PR Comment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-zinc-950 p-4 rounded-md border border-zinc-800 font-mono text-xs text-zinc-400 whitespace-pre-wrap">
                  {analysis.prComment}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="drift" className="mt-6 space-y-4">
          {analysis.driftFindings.length === 0 ? (
            <Card className="border-dashed border-zinc-800 bg-transparent">
              <CardContent className="py-12 text-center text-emerald-400">
                No drift detected. This change aligns well with the project's memory.
              </CardContent>
            </Card>
          ) : (
            analysis.driftFindings.map((finding, i) => (
              <Card key={i} className="border-amber-900/50 bg-amber-950/10">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <Badge variant="outline" className="text-amber-400 border-amber-800/50 uppercase tracking-wider">{finding.type.replace(/_/g, ' ')}</Badge>
                    <Badge variant="destructive" className="bg-red-900/50 text-red-400">Severity: {finding.severity}</Badge>
                  </div>
                  <p className="text-zinc-200 mb-4 font-medium">{finding.description}</p>
                  <div className="bg-zinc-950 rounded p-3 border border-zinc-800 text-sm text-zinc-400 mb-4">
                    <span className="font-semibold text-zinc-300">Evidence:</span> {finding.evidence}
                  </div>
                  {finding.relatedMemoryId && (
                    <div className="text-xs text-zinc-500 flex items-center gap-2">
                      <Brain className="h-3 w-3" /> Related Memory ID: {finding.relatedMemoryId}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="hallucination" className="mt-6 space-y-4">
          {analysis.hallucinationFindings.length === 0 ? (
            <Card className="border-dashed border-zinc-800 bg-transparent">
              <CardContent className="py-12 text-center text-emerald-400">
                No hallucination risk detected.
              </CardContent>
            </Card>
          ) : (
            analysis.hallucinationFindings.map((finding, i) => (
              <Card key={i} className="border-red-900/50 bg-red-950/10">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <Badge variant="outline" className="text-red-400 border-red-800/50 uppercase tracking-wider">{finding.type.replace(/_/g, ' ')}</Badge>
                    <Badge variant="destructive" className="bg-red-900/50 text-red-400">Severity: {finding.severity}</Badge>
                  </div>
                  <p className="text-zinc-200 mb-4 font-medium">{finding.description}</p>
                  <div className="bg-zinc-950 rounded p-3 border border-zinc-800 text-sm text-zinc-400 mb-4">
                    <span className="font-semibold text-zinc-300">Evidence:</span> {finding.evidence}
                  </div>
                  {finding.codeSnippet && (
                    <pre className="bg-zinc-950 p-4 rounded-md border border-zinc-800 font-mono text-xs text-red-300 overflow-x-auto">
                      {finding.codeSnippet}
                    </pre>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="memories" className="mt-6">
          <div className="grid md:grid-cols-2 gap-4">
            {analysis.recalledMemoryIds.map(memId => {
              const mem = seedData.memories.find(m => m.id === memId);
              if (!mem) return null;
              return (
                <Card key={mem.id} className="bg-zinc-900/50 border-zinc-800">
                  <CardHeader className="pb-2 flex flex-row justify-between items-center">
                    <Badge className={CATEGORY_COLORS[mem.category]}>{CATEGORY_LABELS[mem.category]}</Badge>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-zinc-300">{mem.statement}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="files" className="mt-6">
          <Card>
            <CardContent className="p-0">
              <div className="divide-y divide-zinc-800">
                {push.filesChanged.map(file => (
                  <div key={file.filename} className="p-4 flex items-center justify-between hover:bg-zinc-900/50">
                    <span className="font-mono text-sm text-zinc-300">{file.filename}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-mono text-emerald-400">+{file.additions}</span>
                      <span className="text-xs font-mono text-red-400">-{file.deletions}</span>
                      <Badge variant="outline" className={
                        file.status === 'added' ? 'text-emerald-400 border-emerald-800/50' :
                        file.status === 'deleted' ? 'text-red-400 border-red-800/50' :
                        'text-blue-400 border-blue-800/50'
                      }>{file.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
