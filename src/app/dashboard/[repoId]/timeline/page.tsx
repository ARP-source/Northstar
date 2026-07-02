"use client";

import { use } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatRelativeTime, formatDate } from '@/lib/utils';
import { seedData } from '@/lib/db/seed';
import { EVENT_TYPE_CONFIG } from '@/lib/types/timeline';

export default function TimelinePage({ params }: { params: Promise<{ repoId: string }> }) {
  const { repoId } = use(params);
  const events = seedData.timelineEvents.filter(e => e.repoId === repoId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Group by day
  const grouped = events.reduce((acc, event) => {
    const day = new Date(event.createdAt).toLocaleDateString();
    if (!acc[day]) acc[day] = [];
    acc[day].push(event);
    return acc;
  }, {} as Record<string, typeof events>);

  return (
    <div className="space-y-8 max-w-4xl pb-20">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-1 text-zinc-100">Project Timeline</h1>
        <p className="text-zinc-400">Chronological history of how the repository has evolved over time.</p>
      </div>

      <div className="relative border-l border-zinc-800 ml-6 pl-8 space-y-12 mt-8">
        {Object.entries(grouped).map(([day, dayEvents]) => (
          <div key={day} className="relative">
            <div className="absolute -left-[45px] bg-zinc-950 px-2 py-1 text-xs font-semibold text-zinc-500 rounded-full border border-zinc-800">
              {day === new Date().toLocaleDateString() ? 'Today' : formatDate(new Date(dayEvents[0].createdAt)).split(',')[0]}
            </div>
            
            <div className="space-y-6 pt-4">
              {dayEvents.map(event => {
                const config = EVENT_TYPE_CONFIG[event.eventType];
                return (
                  <div key={event.id} className="relative">
                    <div className="absolute -left-[42px] top-1 h-5 w-5 rounded-full bg-zinc-950 border-2 border-zinc-800 flex items-center justify-center text-[10px]">
                      {config.icon}
                    </div>
                    
                    <Card className="bg-zinc-900/40 border-zinc-800 hover:bg-zinc-800/40 transition-colors">
                      <CardContent className="p-5">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-zinc-200">{event.title}</h3>
                          <span className="text-xs text-zinc-500 whitespace-nowrap">{formatRelativeTime(event.createdAt)}</span>
                        </div>
                        <p className="text-sm text-zinc-400 mb-3 leading-relaxed">{event.description}</p>
                        
                        {(event.relatedPushId || event.relatedMemoryId) && (
                          <div className="flex gap-2">
                            {event.relatedPushId && (
                              <Badge variant="outline" className="text-xs bg-zinc-950 border-zinc-800 text-zinc-500">
                                Push: {event.relatedPushId.substring(0, 13)}...
                              </Badge>
                            )}
                            {event.relatedMemoryId && (
                              <Badge variant="outline" className="text-xs bg-zinc-950 border-zinc-800 text-zinc-500">
                                Memory: {event.relatedMemoryId}
                              </Badge>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
