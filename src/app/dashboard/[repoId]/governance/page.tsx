"use client";

import { use } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';
import { seedData } from '@/lib/db/seed';
import { RULE_TYPE_LABELS, RULE_TYPE_COLORS } from '@/lib/types/governance';

export default function GovernancePage({ params }: { params: Promise<{ repoId: string }> }) {
  const { repoId } = use(params);
  const rules = seedData.governanceRules.filter(r => r.repoId === repoId);

  return (
    <div className="space-y-6 max-w-5xl pb-10">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1 text-zinc-100">Governance Rules</h1>
          <p className="text-zinc-400">Explicit constraints that the memory agent enforces on every push.</p>
        </div>
        <Button className="bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-semibold">
          <Plus className="h-4 w-4 mr-2" />
          Add Rule
        </Button>
      </div>

      <div className="space-y-4 mt-8">
        {rules.map(rule => (
          <Card key={rule.id} className={`bg-zinc-900/50 ${!rule.active ? 'opacity-60' : 'border-zinc-800'}`}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-3">
                    <Badge className={RULE_TYPE_COLORS[rule.ruleType]}>{RULE_TYPE_LABELS[rule.ruleType]}</Badge>
                    <h3 className="font-semibold text-lg text-zinc-100">{rule.title}</h3>
                  </div>
                  <p className="text-zinc-300 leading-relaxed max-w-3xl">
                    {rule.description}
                  </p>
                  <div className="text-xs text-zinc-500 pt-2 flex gap-4">
                    <span>Priority: {Array(rule.priority).fill('★').join('')}{Array(5-rule.priority).fill('☆').join('')}</span>
                    <span>Updated {formatRelativeTime(rule.updatedAt)}</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-zinc-400">{rule.active ? 'Active' : 'Inactive'}</span>
                  <Switch checked={rule.active} disabled />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
