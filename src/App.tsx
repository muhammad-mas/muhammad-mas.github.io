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
  { href: '#certifications', label: 'Certifications' },
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
          intro="Commits per day across work and personal projects. Work commits come from Azure DevOps, personal ones from GitHub. Only daily counts are published — no code, repo names or messages."
        >
          <Activity query={contributions} />
        </Section>
        <Section id="experience" title="Experience">
          <Experience jobs={profile.jobs} />
        </Section>
        <Section id="projects" title="Projects" intro="Things I build outside work to learn and try ideas.">
          <Projects projects={projects} contributions={contributions.data} />
        </Section>
        <Section id="skills" title="Skills">
          <Skills groups={profile.skills} />
        </Section>
        <Section id="education" title="Education">
          <Education entries={profile.education} />
        </Section>
        <Section id="certifications" title="Certifications">
          <Certifications />
        </Section>
        <Section id="hobbies" title="Hobbies" intro="Away from the keyboard I play football and train at the gym. Two small games to have a go at.">
          <Hobbies contributions={contributions.data} />
        </Section>
      </main>
      <Footer name={profile.name} contact={profile.contact} />
    </>
  );
}
