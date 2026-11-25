import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export type Kind = 'work' | 'personal';

export interface AzureOrgConfig {
  /** The {organization} in https://dev.azure.com/{organization}. */
  organization: string;
  /** Commits whose author email matches one of these (case-insensitive) are counted. */
  authorEmails: string[];
  /** Default 'work'. */
  kind?: Kind;
  /** Env var holding this org's PAT. Default 'AZDO_PAT'. */
  patEnv?: string;
  /** Only these projects (by name). Default: every project you can read. */
  projects?: string[];
  /** Also read feature branches, not just the default branch. Default true. */
  allBranches?: boolean;
}

export interface GitHubConfig {
  login: string;
  /** Env var holding the token. Default 'GITHUB_TOKEN'. */
  tokenEnv?: string;
  /** "owner/name" repos to leave out of the heatmap. */
  excludeRepos?: string[];
}

export interface SyncConfig {
  projectRepos?: Record<string, string>;
  /** Commits are bucketed into days in this zone. */
  timeZone: string;
  /** First day to collect, YYYY-MM-DD. */
  from: string;
  azureDevOps: AzureOrgConfig[];
  github?: GitHubConfig;
}

export const TOOL_DIR = fileURLToPath(new URL('.', import.meta.url));
export const ROOT_DIR = fileURLToPath(new URL('../../', import.meta.url));
export const CONFIG_PATH = `${TOOL_DIR}config.local.json`;
export const CACHE_DIR = `${TOOL_DIR}cache`;
export const OUTPUT_PATH = `${ROOT_DIR}public/data/contributions.json`;
export const PROJECTS_PATH = `${ROOT_DIR}src/content/projects.json`;

const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function parseConfig(raw: unknown): SyncConfig {
  if (typeof raw !== 'object' || raw === null) throw new Error('Config must be a JSON object.');
  const c = raw as Partial<SyncConfig>;
  if (typeof c.timeZone !== 'string') throw new Error('Config: "timeZone" is required, e.g. "Europe/London".');
  if (typeof c.from !== 'string' || !DAY_PATTERN.test(c.from)) throw new Error('Config: "from" must be a date like "2024-01-01".');
  const azure = c.azureDevOps ?? [];
  if (!Array.isArray(azure)) throw new Error('Config: "azureDevOps" must be a list.');
  for (const org of azure) {
    if (!org.organization) throw new Error('Config: each azureDevOps entry needs "organization".');
    if (!Array.isArray(org.authorEmails) || org.authorEmails.length === 0) {
      throw new Error(`Config: azureDevOps "${org.organization}" needs at least one "authorEmails" entry.`);
    }
  }
  if (c.github && typeof c.github.login !== 'string') throw new Error('Config: "github.login" is required.');
  // Throws RangeError for an unknown zone.
  new Intl.DateTimeFormat('en-CA', { timeZone: c.timeZone });
  return { timeZone: c.timeZone, from: c.from, azureDevOps: azure, github: c.github, projectRepos: c.projectRepos };
}

export function loadConfig(path = CONFIG_PATH): SyncConfig {
  if (!existsSync(path)) {
    throw new Error(
      `No config at ${path}.\nCopy tools/contrib-sync/config.example.json to config.local.json and fill in your org and work email.`,
    );
  }
  return parseConfig(JSON.parse(readFileSync(path, 'utf8')));
}

export interface ProjectRef {
  slug: string;
  repo?: string;
}

export function loadProjects(path = PROJECTS_PATH): ProjectRef[] {
  return JSON.parse(readFileSync(path, 'utf8')) as ProjectRef[];
}
