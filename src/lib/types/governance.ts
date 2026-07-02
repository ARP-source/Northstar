// Governance type definitions for NorthStar

export type GovernanceRuleType = 
  | 'north_star'
  | 'do_not_break'
  | 'tech_stack'
  | 'style_preference'
  | 'forbidden_pattern'
  | 'non_goal';

export interface GovernanceRule {
  id: string;
  repoId: string;
  ruleType: GovernanceRuleType;
  title: string;
  description: string;
  priority: number; // 1-5
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export const RULE_TYPE_LABELS: Record<GovernanceRuleType, string> = {
  north_star: 'North Star',
  do_not_break: 'Do Not Break',
  tech_stack: 'Tech Stack Constraint',
  style_preference: 'Style & Architecture',
  forbidden_pattern: 'Forbidden Pattern',
  non_goal: 'Non-Goal',
};

export const RULE_TYPE_COLORS: Record<GovernanceRuleType, string> = {
  north_star: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  do_not_break: 'text-red-400 bg-red-400/10 border-red-400/20',
  tech_stack: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  style_preference: 'text-violet-400 bg-violet-400/10 border-violet-400/20',
  forbidden_pattern: 'text-rose-400 bg-rose-400/10 border-rose-400/20',
  non_goal: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
};
