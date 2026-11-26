// All CV content lives here, so the components only render data.
// Edit this file to update the site; no component changes needed.

export interface Contact {
  email: string;
  linkedIn: string;
  gitHub: string;
}

export interface KeyWin {
  value: string;
  label: string;
}

export interface Job {
  title: string;
  company: string;
  start: string;
  end: string;
  summary: string;
  highlights: string[];
  stack: string[];
  /** Optional context shown behind an ⓘ next to the company name. */
  companyNote?: string;
}

export interface SkillGroup {
  name: string;
  items: string[];
}

export interface Education {
  degree: string;
  honours: string;
  school: string;
  graduated: string;
}

export interface Profile {
  name: string;
  title: string;
  tagline: string;
  location: string;
  workRights: string;
  about: string[];
  contact: Contact;
  keyWins: KeyWin[];
  jobs: Job[];
  skills: SkillGroup[];
  education: Education[];
}

export const profile: Profile = {
  name: 'Muhammad Arslan',
  title: 'Full-Stack Software Engineer',
  tagline: 'C# .NET back ends and APIs, with React, Vue and React Native on the front.',
  location: 'London, UK',
  workRights: 'Full UK right to work',
  about: [
    'Full-stack engineer, 6+ years in. I build fast .NET APIs and clean React and Vue front ends, and I’m happy working directly with clients.',
  ],
  contact: {
    email: 'arslan.mas02@gmail.com',
    linkedIn: 'https://www.linkedin.com/in/arslan-mas02',
    gitHub: 'https://github.com/muhammad-mas',
  },
  keyWins: [
    { value: '3 min → 30 s', label: 'API response time' },
    { value: '8,000+', label: 'App users' },
    { value: '500', label: 'Sign-ups, built solo' },
    { value: '6+ years', label: 'In engineering' },
  ],
  jobs: [
    {
      title: 'Software Engineer',
      company: 'Paramet Limited',
      companyNote: 'I work with Paramet through my own company, MAS Solutions.',
      start: 'Jan 2024',
      end: 'Present',
      summary: 'Web quotation system for an HVAC manufacturer, and a React Native app for a UK trade association.',
      highlights: [
        'Cut the quotation API from 3 minutes to 30 seconds.',
        'Made 200 MB imports (100,000 records) stop timing out.',
        'Maintain a React Native app with 8,000+ users; lead the React and Vue front end.',
      ],
      stack: ['C#', '.NET Core', 'SQL Server', 'React', 'Vue', 'React Native', 'Azure', 'AWS'],
    },
    {
      title: 'Software Engineer',
      company: 'Greybeard',
      start: 'Aug 2023',
      end: 'Jan 2024',
      summary: 'Costing and pricing in Halifax Fan’s quoting tool, used by 30+ sales staff.',
      highlights: [],
      stack: ['C#', 'ASP.NET MVC', 'SQL Server', 'SAP Business One'],
    },
    {
      title: 'Full-Stack Developer',
      company: 'Caterpillhers',
      start: 'Sep 2022',
      end: 'Aug 2023',
      summary: 'Designed, built and launched a web app solo: 500 sign-ups.',
      highlights: [],
      stack: ['Node.js', 'Express', 'Angular'],
    },
    {
      title: 'Assistant Manager (Tech)',
      company: 'NESCOM',
      start: 'Jul 2020',
      end: 'Jun 2022',
      summary: 'C# desktop software to fly and monitor drones; QA on safety-critical aerospace systems.',
      highlights: [],
      stack: ['C#', 'WPF'],
    },
  ],
  skills: [
    { name: 'Back end', items: ['C#', '.NET Core', 'Node.js', 'REST APIs', 'Event-driven'] },
    { name: 'Front end & mobile', items: ['TypeScript', 'React', 'Vue', 'Angular', 'React Native'] },
    { name: 'Data & cloud', items: ['SQL Server', 'PostgreSQL', 'Azure', 'AWS', 'Docker', 'CI/CD'] },
  ],
  education: [
    {
      degree: 'BS Computer Science',
      honours: 'Magna Cum Laude',
      school: 'FAST University, Islamabad',
      graduated: 'Jul 2020',
    },
  ],
};
