// npm run sync [-- --only azure|github] [--full] [--dry-run] [--verbose]
//
// Pulls commit dates from Azure DevOps (work) and GitHub (personal), then
// writes public/data/contributions.json with daily counts only.
// Tokens come from .env; org names, emails and repo names stay in the
// gitignored config.local.json and cache/ folder.

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { parseArgs } from 'node:util';
import { azureDays, buildOutput, gitHubDays, repoDays, toLocalDay, type DayCounts } from './aggregate.ts';
import { syncAzureOrg, basicAuth } from './azureDevOps.ts';
import {
  azureCachePath,
  emptyAzureCache,
  emptyGitHubCache,
  gitHubCachePath,
  readCache,
  writeCache,
  type AzureCache,
  type GitHubCache,
} from './cache.ts';
import { loadConfig, loadProjects, OUTPUT_PATH, type Kind } from './config.ts';
import { syncGitHub } from './github.ts';
import { createHttpClient } from './http.ts';
import { serializeContributions } from './serialize.ts';
import { assertPublicShape } from './validate.ts';

const { values: args } = parseArgs({
  options: {
    only: { type: 'string' },
    full: { type: 'boolean', default: false },
    'dry-run': { type: 'boolean', default: false },
    verbose: { type: 'boolean', default: false },
  },
});

const runAzure = !args.only || args.only === 'azure';
const runGitHub = !args.only || args.only === 'github';
const log = { info: (message: string) => console.log(message) };
const warn = (message: string) => {
  if (process.env.REQUIRE_COMPLETE_SYNC === '1') throw new Error(message);
  console.warn(`! ${message}`);
};

async function main(): Promise<void> {
  const config = loadConfig();
  const projects = loadProjects().map(p => ({ ...p, repo: config.projectRepos?.[p.slug] ?? p.repo }));
  const now = new Date();
  const today = toLocalDay(now.toISOString(), config.timeZone);

  // Azure DevOps, one cache per organization.
  const azureCaches: { kind: Kind; cache: AzureCache }[] = [];
  for (const org of config.azureDevOps) {
    const path = azureCachePath(org.organization);
    let cache = readCache(path, emptyAzureCache);
    const pat = process.env[org.patEnv ?? 'AZDO_PAT'];
    if (runAzure && pat) {
      const client = createHttpClient({ authorization: basicAuth(pat), service: 'Azure DevOps' });
      try {
        const updated = await syncAzureOrg(client, org, args.full ? emptyAzureCache() : cache, {
          configFrom: config.from, now, log: args.verbose ? log : { info: () => {} },
        });
        if (!args['dry-run']) writeCache(path, updated);
        cache = updated;
      } catch (error) {
        // One org refusing the token (each PAT is made for specific orgs) shouldn't stop the others.
        const reason = error instanceof Error ? error.message : String(error);
        warn(`${org.organization}: skipped (${reason}). Using cached data for it (${Object.keys(cache.commits).length} commits).`);
      }
    } else if (runAzure) {
      warn(`${org.patEnv ?? 'AZDO_PAT'} is not set — using cached Azure DevOps data for this org (${Object.keys(cache.commits).length} commits).`);
    }
    azureCaches.push({ kind: org.kind ?? 'work', cache });
  }

  // GitHub.
  let gitHub: GitHubCache = readCache(gitHubCachePath(), emptyGitHubCache);
  if (config.github) {
    const token = process.env[config.github.tokenEnv ?? 'GITHUB_TOKEN'];
    if (runGitHub && token) {
      const client = createHttpClient({ authorization: `bearer ${token}`, service: 'GitHub' });
      gitHub = await syncGitHub(client, {
        login: config.github.login,
        fromDay: config.from,
        toDay: today,
        timeZone: config.timeZone,
        now,
        log: args.verbose ? log : undefined,
      }, args.full ? undefined : gitHub);
      if (!args['dry-run']) writeCache(gitHubCachePath(), gitHub);
    } else if (runGitHub) {
      warn(`${config.github.tokenEnv ?? 'GITHUB_TOKEN'} is not set — using cached GitHub data.`);
    }
  }

  // Build the public file.
  const sources: { kind: Kind; days: DayCounts }[] = (['work', 'personal'] as const).map((kind) => ({
    kind,
    days: azureDays(
      azureCaches.filter((c) => c.kind === kind).map((c) => c.cache),
      config.timeZone,
    ),
  }));
  sources.push({ kind: 'personal', days: gitHubDays(gitHub, config.github?.excludeRepos) });

  const output = buildOutput({
    sources,
    projects: projects.filter((p) => p.repo).map((p) => ({ slug: p.slug, days: repoDays(gitHub, p.repo!) })),
    from: config.from,
    to: today,
    generatedAt: now.toISOString(),
  });
  assertPublicShape(
    output,
    projects.map((p) => p.slug),
  );

  printSummary(output.days, gitHub, args.verbose);
  if (args['dry-run']) {
    console.log('\nDry run: nothing written.');
    return;
  }
  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, serializeContributions(output));
  console.log(`\nWrote ${OUTPUT_PATH}`);
  console.log('Review it, then commit and push to publish.');
}

function printSummary(days: Record<string, { work: number; personal: number }>, gitHub: GitHubCache, verbose: boolean): void {
  const byYear = new Map<string, { work: number; personal: number }>();
  for (const [day, split] of Object.entries(days)) {
    const year = byYear.get(day.slice(0, 4)) ?? { work: 0, personal: 0 };
    year.work += split.work;
    year.personal += split.personal;
    byYear.set(day.slice(0, 4), year);
  }
  console.log('\nCommits per year:');
  console.table(Object.fromEntries([...byYear].map(([year, t]) => [year, { ...t, total: t.work + t.personal }])));
  if (verbose) {
    console.log('GitHub repos (local only, not published):');
    for (const [repo, counts] of Object.entries(gitHub.repos)) {
      console.log(`  ${repo}: ${Object.values(counts).reduce((a, b) => a + b, 0)}`);
    }
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
