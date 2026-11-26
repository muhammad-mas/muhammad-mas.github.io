import type { Project, ProjectStatus } from '../../content/projects';
import type { ContributionsFile } from '../../types/contributions';
import { GitHubIcon, LockIcon } from '../layout/Icons';
import { ProjectActivity } from './ProjectActivity';

const STATUS_LABEL: Record<ProjectStatus, string> = {
  'in-progress': 'In progress',
  live: 'Live',
  archived: 'Archived',
};

export function ProjectCard({ project, contributions }: { project: Project; contributions?: ContributionsFile }) {
  const projectDays = contributions?.projects[project.slug];
  return (
    <article className="project card" aria-labelledby={`project-${project.slug}`}>
      <div className="project__header">
        <h3 id={`project-${project.slug}`} className="project__name">
          {project.name}
        </h3>
        <span className={`project__status project__status--${project.status}`}>{STATUS_LABEL[project.status]}</span>
      </div>
      <p className="project__summary">{project.summary}</p>
      <ul className="chip-list" aria-label={`${project.name} tech stack`}>
        {project.stack.map((tech) => (
          <li key={tech} className="chip">
            {tech}
          </li>
        ))}
      </ul>
      {contributions && projectDays && <ProjectActivity days={projectDays} lastSynced={contributions.to} />}
      <div className="project__links">
        {project.links.live && (
          <a className="button button--primary" href={project.links.live}>
            Visit
          </a>
        )}
        {project.links.demo && (
          <a className="button" href={project.links.demo}>
            Demo
          </a>
        )}
        {project.repo && project.repoPublic && (
          <a className="button" href={`https://github.com/${project.repo}`}>
            <GitHubIcon /> Code
          </a>
        )}
        {project.repoPublic === false && (
          <span className="project__private">
            <LockIcon /> Private repo, demo on request
          </span>
        )}
      </div>
    </article>
  );
}
