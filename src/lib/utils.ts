import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return formatDate(date);
}

export function scoreColor(score: number, inverted = false): string {
  const effective = inverted ? 100 - score : score;
  if (effective >= 70) return 'text-emerald-400';
  if (effective >= 40) return 'text-amber-400';
  return 'text-red-400';
}

export function scoreBgColor(score: number, inverted = false): string {
  const effective = inverted ? 100 - score : score;
  if (effective >= 70) return 'bg-emerald-400/10';
  if (effective >= 40) return 'bg-amber-400/10';
  return 'bg-red-400/10';
}
