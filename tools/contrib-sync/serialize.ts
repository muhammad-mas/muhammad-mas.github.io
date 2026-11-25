import type { ContributionsFile } from '../../src/types/contributions.ts';

/** One day per line, so each sync's git diff shows exactly which days changed. */
export function serializeContributions(file: ContributionsFile): string {
  const head = Object.entries(file)
    .filter(([key]) => key !== 'days' && key !== 'projects')
    .map(([key, value]) => `  ${JSON.stringify(key)}: ${JSON.stringify(value)}`);
  const block = (record: Record<string, unknown>) =>
    Object.entries(record)
      .map(([key, value]) => `    ${JSON.stringify(key)}: ${JSON.stringify(value)}`)
      .join(',\n');
  return [
    '{',
    `${head.join(',\n')},`,
    '  "days": {',
    block(file.days),
    '  },',
    '  "projects": {',
    block(file.projects),
    '  }',
    '}',
    '',
  ].join('\n');
}
