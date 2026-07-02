import Link from 'next/link';
import { Compass, Brain, Shield, GitCommit, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-md sticky top-0 z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-zinc-100">
            <Compass className="h-6 w-6 text-emerald-400" />
            <span className="font-bold text-lg tracking-tight">NorthStar</span>
          </div>
          <nav className="flex gap-4">
            <Link href="https://github.com/QwenLM/Qwen" target="_blank" className="text-sm font-medium text-zinc-400 hover:text-zinc-100 transition-colors">Powered by Qwen Cloud</Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-20 flex flex-col items-center">
        <div className="max-w-4xl text-center space-y-8 mb-16">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-balance">
            Software repos need <span className="text-emerald-400">memory</span>,<br />not just generation.
          </h1>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto text-balance">
            NorthStar remembers what a project was supposed to become, tracks every push, detects drift from the original goal, and flags hallucinated changes before they compound.
          </p>
          <div className="flex justify-center gap-4 pt-4">
            <Link href="/dashboard/demo-studyflow-001">
              <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-semibold gap-2">
                View Live Demo <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl w-full mb-20">
          <Card className="bg-zinc-900/50 border-zinc-800/50">
            <CardContent className="pt-6 space-y-4">
              <div className="h-12 w-12 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Brain className="h-6 w-6 text-emerald-400" />
              </div>
              <h3 className="text-xl font-semibold">Long-Term Memory</h3>
              <p className="text-zinc-400">Extracts and remembers product goals, technical constraints, non-goals, and architectural decisions.</p>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900/50 border-zinc-800/50">
            <CardContent className="pt-6 space-y-4">
              <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <GitCommit className="h-6 w-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold">Push Analysis</h3>
              <p className="text-zinc-400">Analyzes every git push and PR, understanding the intent and comparing it against the project's memory graph.</p>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900/50 border-zinc-800/50">
            <CardContent className="pt-6 space-y-4">
              <div className="h-12 w-12 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Shield className="h-6 w-6 text-amber-400" />
              </div>
              <h3 className="text-xl font-semibold">Drift Detection</h3>
              <p className="text-zinc-400">Flags when vibe-coded changes slowly move the repo away from its original intent or introduce hallucinated logic.</p>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="py-8 text-center text-zinc-500 text-sm border-t border-zinc-900">
        Built for the Qwen Cloud Global AI Hackathon &middot; Track 1: MemoryAgent
      </footer>
    </div>
  );
}
