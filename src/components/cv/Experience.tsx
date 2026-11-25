import type { Job } from '../../content/profile';
import { ExperienceItem } from './ExperienceItem';

export function Experience({ jobs }: { jobs: Job[] }) {
  return (
    <ol className="timeline">
      {jobs.map((job) => (
        <ExperienceItem key={`${job.company}-${job.start}`} job={job} />
      ))}
    </ol>
  );
}
