"use client";

import { use, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatRelativeTime } from '@/lib/utils';
import { seedData } from '@/lib/db/seed';
import { CATEGORY_LABELS, CATEGORY_COLORS } from '@/lib/types/memory';
import type { Memory, MemoryCategory, MemoryStatus } from '@/lib/types/memory';

export default function MemoryExplorerPage({ params }: { params: Promise<{ repoId: string }> }) {
  const { repoId } = use(params);
  const allMemories = seedData.memories.filter(m => m.repoId === repoId);
  
  const [activeTab, setActiveTab] = useState<'active' | 'archived' | 'all'>('active');
  const [selectedCategory, setSelectedCategory] = useState<MemoryCategory | 'ALL'>('ALL');

  const filteredMemories = allMemories.filter(m => {
    if (activeTab !== 'all' && m.status !== activeTab) return false;
    if (selectedCategory !== 'ALL' && m.category !== selectedCategory) return false;
    return true;
  });

  // Calculate category counts for active memories
  const categoryCounts = allMemories.reduce((acc, m) => {
    if (m.status === 'active') {
      acc[m.category] = (acc[m.category] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-1 text-zinc-100">Project Memory</h1>
        <p className="text-zinc-400">Structured knowledge extracted from code, docs, and prior pushes.</p>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList>
            <TabsTrigger value="active">Active ({allMemories.filter(m=>m.status==='active').length})</TabsTrigger>
            <TabsTrigger value="archived">Archived ({allMemories.filter(m=>m.status==='archived').length})</TabsTrigger>
            <TabsTrigger value="all">All ({allMemories.length})</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex flex-wrap gap-2">
          <Badge 
            variant="outline" 
            className={`cursor-pointer hover:bg-zinc-800 ${selectedCategory === 'ALL' ? 'bg-zinc-800 text-zinc-100' : ''}`}
            onClick={() => setSelectedCategory('ALL')}
          >
            All Categories
          </Badge>
          {Object.entries(CATEGORY_LABELS).map(([cat, label]) => {
            const count = categoryCounts[cat];
            if (!count) return null; // Only show categories with memories
            return (
              <Badge 
                key={cat}
                variant="outline"
                className={`cursor-pointer hover:bg-zinc-800 ${selectedCategory === cat ? 'bg-zinc-800 text-zinc-100 border-zinc-500' : 'border-zinc-800 text-zinc-400'}`}
                onClick={() => setSelectedCategory(cat as MemoryCategory)}
              >
                {label} ({count})
              </Badge>
            );
          })}
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMemories.length === 0 ? (
          <div className="col-span-full py-12 text-center text-zinc-500 border border-dashed border-zinc-800 rounded-xl">
            No memories found matching filters.
          </div>
        ) : (
          filteredMemories.map(memory => (
            <MemoryCard key={memory.id} memory={memory} />
          ))
        )}
      </div>
    </div>
  );
}

function MemoryCard({ memory }: { memory: Memory }) {
  const [expanded, setExpanded] = useState(false);
  const colorClass = CATEGORY_COLORS[memory.category] || 'bg-zinc-800 text-zinc-300';
  
  return (
    <Card 
      className={`flex flex-col ${memory.status === 'archived' ? 'opacity-60 grayscale' : ''}`}
      onClick={() => setExpanded(!expanded)}
    >
      <CardHeader className="pb-3 flex flex-row items-start justify-between">
        <Badge className={colorClass}>{CATEGORY_LABELS[memory.category]}</Badge>
        <div className="flex items-center gap-2">
          {memory.status === 'archived' && (
            <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Archived</span>
          )}
          <span className="text-xs text-zinc-500">{formatRelativeTime(memory.updatedAt)}</span>
        </div>
      </CardHeader>
      <CardContent className="flex-1 cursor-pointer">
        <p className="text-zinc-200 text-sm leading-relaxed mb-4">
          {memory.statement}
        </p>
        
        {expanded && (
          <div className="mt-4 pt-4 border-t border-zinc-800/50 space-y-4 animate-in fade-in slide-in-from-top-2">
            <div>
              <div className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-1">Evidence</div>
              <p className="text-xs text-zinc-400 bg-zinc-950 p-2 rounded border border-zinc-800/50">{memory.evidence}</p>
            </div>
            
            <div className="flex justify-between items-center text-xs">
              <div>
                <span className="text-zinc-500 mr-2">Confidence:</span>
                <span className="text-zinc-300 font-mono">{(memory.confidenceScore * 100).toFixed(0)}%</span>
              </div>
              <div>
                <span className="text-zinc-500 mr-2">Importance:</span>
                <span className="text-zinc-300 font-mono">{(memory.importanceScore * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-0 pb-4 flex flex-wrap gap-1.5">
        {memory.relatedModules.map(mod => (
          <Badge key={mod} variant="outline" className="text-[10px] bg-zinc-950/50 text-zinc-400 border-zinc-800">
            mod: {mod}
          </Badge>
        ))}
        {memory.relatedFiles.slice(0, 2).map(file => (
          <Badge key={file} variant="outline" className="text-[10px] bg-zinc-950/50 text-zinc-500 border-zinc-800 max-w-[120px] truncate">
            {file.split('/').pop()}
          </Badge>
        ))}
        {memory.relatedFiles.length > 2 && (
          <Badge variant="outline" className="text-[10px] bg-zinc-950/50 text-zinc-500 border-zinc-800">
            +{memory.relatedFiles.length - 2} more
          </Badge>
        )}
      </CardFooter>
    </Card>
  );
}
