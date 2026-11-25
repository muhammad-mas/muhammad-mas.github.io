import type { ReactNode } from 'react';

interface SectionProps {
  id: string;
  title: string;
  intro?: ReactNode;
  children: ReactNode;
}

export function Section({ id, title, intro, children }: SectionProps) {
  const headingId = `${id}-heading`;
  return (
    <section id={id} aria-labelledby={headingId} className="section">
      <div className="container">
        <h2 id={headingId} className="section__title">
          {title}
        </h2>
        {intro ? <p className="section__intro">{intro}</p> : null}
        {children}
      </div>
    </section>
  );
}
