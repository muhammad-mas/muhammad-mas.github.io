import type { ReactNode } from 'react';
import { useReveal } from '../../hooks/useReveal';

interface SectionProps {
  id: string;
  title: string;
  intro?: ReactNode;
  children: ReactNode;
}

export function Section({ id, title, intro, children }: SectionProps) {
  const headingId = `${id}-heading`;
  const revealRef = useReveal<HTMLDivElement>();
  return (
    <section id={id} aria-labelledby={headingId} className="section">
      <div ref={revealRef} className="container">
        <h2 id={headingId} className="section__title">
          {title}
        </h2>
        {intro ? <p className="section__intro">{intro}</p> : null}
        {children}
      </div>
    </section>
  );
}
