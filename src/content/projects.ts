import data from './projects.json';

export type ProjectStatus = 'in-progress' | 'live' | 'archived';

export interface Project {
  /** Stable id; also the key for this project's commits in contributions.json. */
  slug: string;
  name: string;
  summary: string;
  highlights: string[];
  stack: string[];
  status: ProjectStatus;
  started: string;
  /** GitHub "owner/name". The sync tool counts commits for this repo. */
  repo?: string;
  /** Only public repos get a "Code" link. */
  repoPublic?: boolean;
  links: { live?: string; demo?: string };
}

export const projects = data as Project[];
