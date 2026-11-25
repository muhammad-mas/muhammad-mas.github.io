// What the targets in the goal reveal: CV wins, coding habits and a project.

import type { Profile } from '../../content/profile';
import type { Project } from '../../content/projects';
import { busiestWeekday, longestStreak } from '../../lib/habits';
import type { ContributionsFile } from '../../types/contributions';
import { formatShortDate } from '../heatmap/format';

export interface KickTarget {
  id: string;
  /** The big number or name, e.g. '8,000+'. */
  value: string;
  label: string;
  detail: string;
  href?: string;
}

export function buildTargets(profile: Profile, projects: Project[], contributions?: ContributionsFile): KickTarget[] {
  const wins = profile.keyWins;
  const sampleNote = contributions?.sample ? ' (sample data until the first real sync)' : '';
  const targets: KickTarget[] = [];

  if (wins[0]) targets.push({ id: 'speed', value: wins[0].value, label: 'API speed-up', detail: wins[0].label, href: '#experience' });
  if (wins[1]) targets.push({ id: 'users', value: wins[1].value, label: 'App users', detail: wins[1].label, href: '#experience' });

  const streak = contributions ? longestStreak(contributions) : null;
  if (streak && streak.days > 0 && streak.start && streak.end) {
    targets.push({
      id: 'streak',
      value: `${streak.days} days`,
      label: 'Longest commit streak',
      detail: `Committed every day from ${formatShortDate(streak.start)} to ${formatShortDate(streak.end)}${sampleNote}.`,
      href: '#activity',
    });
  } else if (wins[2]) {
    targets.push({ id: 'signups', value: wins[2].value, label: 'Sign-ups', detail: wins[2].label });
  }

  if (contributions) {
    const busiest = busiestWeekday(contributions);
    targets.push({
      id: 'weekday',
      value: `${busiest.name}s`,
      label: 'Busiest coding day',
      detail: `${busiest.average} commits on an average ${busiest.name}${sampleNote}.`,
      href: '#activity',
    });
  } else if (wins[3]) {
    targets.push({ id: 'years', value: wins[3].value, label: 'Experience', detail: wins[3].label, href: '#experience' });
  }

  const project = projects[0];
  if (project) {
    targets.push({ id: `project-${project.slug}`, value: project.name, label: 'Building now', detail: project.summary, href: '#projects' });
  }
  return targets;
}
