import type { Project } from '../../content/projects';
import type { ContributionsFile } from '../../types/contributions';
import { ProjectCard } from './ProjectCard';

export function Projects({ projects, contributions }: { projects: Project[]; contributions?: ContributionsFile }) {
  return (
    <div className="projects">
      {projects.map((project) => (
        <ProjectCard key={project.slug} project={project} contributions={contributions} />
      ))}
    </div>
  );
}
