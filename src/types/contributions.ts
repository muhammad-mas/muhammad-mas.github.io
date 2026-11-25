// Shape of public/data/contributions.json. Shared by the site and the sync tool.
// Privacy rule: this file may hold dates and counts only — never repo names,
// commit messages, org names or emails.

/** A calendar date, YYYY-MM-DD, in the sync tool's time zone (Europe/London). */
export type DayKey = string;

export interface DaySplit {
  work: number;
  personal: number;
}

export interface ContributionsFile {
  generatedAt: string;
  /** First and last day covered, inclusive. */
  from: DayKey;
  to: DayKey;
  /** True for the hand-made demo data, so the site can label it. */
  sample?: boolean;
  /** Only days with at least one commit. */
  days: Record<DayKey, DaySplit>;
  /** Per-project daily commit counts, keyed by project slug. */
  projects: Record<string, Record<DayKey, number>>;
}

export const ALLOWED_TOP_LEVEL_KEYS = ['generatedAt', 'from', 'to', 'sample', 'days', 'projects'] as const;
