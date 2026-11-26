import { Certifications } from './components/cv/Certifications';
import { Education } from './components/cv/Education';
import { Experience } from './components/cv/Experience';
import { Hero } from './components/cv/Hero';
import { KeyWins } from './components/cv/KeyWins';
import { Skills } from './components/cv/Skills';
import { Activity } from './components/heatmap/Activity';
import { Hobbies } from './components/hobbies/Hobbies';
import { Footer } from './components/layout/Footer';
import { Header } from './components/layout/Header';
import type { NavLink } from './components/layout/Nav';
import { Section } from './components/layout/Section';
import { Projects } from './components/projects/Projects';
import { profile } from './content/profile';
import { projects } from './content/projects';
import { useContributions } from './hooks/useContributions';

const NAV: NavLink[] = [
  { href: '#activity', label: 'Activity' },
  { href: '#experience', label: 'Experience' },
  { href: '#projects', label: 'Projects' },
  { href: '#skills', label: 'Skills' },
  { href: '#education', label: 'Education' },
  { href: '#hobbies', label: 'Hobbies' },
];

export function App() {
  const contributions = useContributions();

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Header name={profile.name} links={NAV} />
      <main id="main">
        <div id="top" />
        <Hero profile={profile} />
        <KeyWins wins={profile.keyWins} />
        <Section
          id="activity"
          title="Activity"
          intro="Commits per day, work and personal."
        >
          <Activity query={contributions} />
        </Section>
        <Section id="experience" title="Experience">
          <Experience jobs={profile.jobs} />
        </Section>
        <Section id="projects" title="Projects" intro="What I build outside work.">
          <Projects projects={projects} contributions={contributions.data} />
        </Section>
        <Section id="skills" title="Skills">
          <Skills groups={profile.skills} />
        </Section>
        <Section id="education" title="Education">
          <Education entries={profile.education} />
          <Certifications />
        </Section>
        <Section id="hobbies" title="Hobbies" intro="Football and the gym, as two small games.">
          <Hobbies contributions={contributions.data} />
        </Section>
      </main>
      <Footer name={profile.name} contact={profile.contact} />
    </>
  );
}
