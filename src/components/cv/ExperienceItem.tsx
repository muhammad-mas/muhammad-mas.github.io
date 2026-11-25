import type { Job } from '../../content/profile';
import { InfoTip } from './InfoTip';

export function ExperienceItem({ job }: { job: Job }) {
  return (
    <li className="job">
      <div className="job__header">
        <h3 className="job__title">
          {job.title} <span className="job__company">· {job.company}</span>
          {job.companyNote && <InfoTip label={`About ${job.company}`} text={job.companyNote} />}
        </h3>
        <p className="job__dates">
          {job.start} – {job.end}
        </p>
      </div>
      <p className="job__summary">{job.summary}</p>
      <ul className="job__highlights">
        {job.highlights.map((item) => (
          <li key={item.slice(0, 32)}>{item}</li>
        ))}
      </ul>
      <ul className="chip-list" aria-label={`${job.company} tech stack`}>
        {job.stack.map((tech) => (
          <li key={tech} className="chip">
            {tech}
          </li>
        ))}
      </ul>
    </li>
  );
}
