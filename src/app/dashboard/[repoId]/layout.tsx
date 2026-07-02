"use client";

import { use } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, LayoutDashboard, Brain, GitCommit, Shield, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { seedData } from '@/lib/db/seed';

export default function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ repoId: string }>;
}) {
  const { repoId } = use(params);
  const pathname = usePathname();
  
  // For demo, just use seed repo data for sidebar context
  const repo = seedData.repos.find(r => r.id === repoId) || seedData.repos[0];

  const navItems = [
    { name: 'Overview', href: `/dashboard/${repoId}`, icon: LayoutDashboard },
    { name: 'Memory', href: `/dashboard/${repoId}/memory`, icon: Brain },
    { name: 'Pushes', href: `/dashboard/${repoId}/pushes`, icon: GitCommit },
    { name: 'Governance', href: `/dashboard/${repoId}/governance`, icon: Shield },
    { name: 'Timeline', href: `/dashboard/${repoId}/timeline`, icon: Clock },
  ];

  return (
    <div className="flex min-h-screen bg-zinc-950">
      {/* Sidebar */}
      <aside className="w-64 border-r border-zinc-800 bg-zinc-950 flex flex-col fixed inset-y-0 z-10">
        <div className="h-16 flex items-center px-6 border-b border-zinc-800">
          <Link href="/" className="flex items-center gap-2 text-zinc-100">
            <Compass className="h-5 w-5 text-emerald-400" />
            <span className="font-bold tracking-tight">NorthStar</span>
          </Link>
        </div>
        
        <div className="p-4 border-b border-zinc-800/50">
          <div className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-1">Repository</div>
          <div className="font-medium text-zinc-200 truncate" title={repo.githubUrl}>{repo.owner}/{repo.name}</div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-zinc-800 text-zinc-100" 
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                )}
              >
                <item.icon className={cn("h-4 w-4", isActive ? "text-emerald-400" : "text-zinc-500")} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-zinc-800/50">
          <div className="flex justify-between items-center text-xs mb-2">
            <span className="text-zinc-400">Health Score</span>
            <span className={cn("font-medium", repo.alignmentScore >= 70 ? "text-emerald-400" : "text-amber-400")}>
              {repo.alignmentScore}/100
            </span>
          </div>
          <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
            <div 
              className={cn("h-full", repo.alignmentScore >= 70 ? "bg-emerald-400" : "bg-amber-400")} 
              style={{ width: `${repo.alignmentScore}%` }}
            />
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 ml-64 p-8 min-h-screen">
        {children}
      </main>
    </div>
  );
}
