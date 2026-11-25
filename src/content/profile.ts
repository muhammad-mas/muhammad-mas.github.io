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
    'Full-stack engineer with 6+ years in engineering. Strongest on C# and .NET Core back ends and API design, with React and Vue on the front end, plus maintaining a React Native app with 8,000+ users.',
    'I cut a key API’s response time from 3 minutes to 30 seconds, built and launched a product solo, and I’m comfortable working directly with clients. Experience in industrial manufacturing, a UK trade association and aerospace, with a BS in Computer Science.',
  ],
  contact: {
    email: 'arslan.mas02@gmail.com',
    linkedIn: 'https://www.linkedin.com/in/arslan-mas02',
    gitHub: 'https://github.com/muhammad-mas',
  },
  keyWins: [
    { value: '3 min → 30 s', label: 'Quotation API response time after optimizing EF Core queries' },
    { value: '8,000+', label: 'Users on the React Native app I maintain' },
    { value: '500', label: 'Sign-ups for a web app I designed, built and launched solo' },
    { value: '6+ years', label: 'In engineering, from aerospace to manufacturing' },
  ],
  jobs: [
    {
      title: 'Software Engineer',
      company: 'Paramet Limited',
      companyNote: 'I work with Paramet through my own company, MAS Solutions.',
      start: 'Jan 2024',
      end: 'Present',
      summary:
        'Web-based quotation system for a Samsung-owned HVAC manufacturer moving off desktop tools, plus a React Native app for a UK trade association.',
      highlights: [
        'Built a web-based quotation system with an Agile team (20+ users) that combines quotes from product-selection tools, prices them and runs event-driven approvals via Azure and Dynamics 365.',
        'Built its Power Automate approvals, multi-region settings and user roles and permissions, and co-built the pricing.',
        'Cut the quotation API’s response time from 3 minutes to 30 seconds by fixing N+1 queries, using EF Core split queries for a query with multiple joins, and disabling change tracking for read-only results.',
        'Stopped 200 MB file uploads (100,000 records) timing out by moving the import into SQL Server stored procedures: the API responds straight away, data is processed in chunks, and the front end polls until it has finished.',
        'Built a reusable React table component on React Table, with lazy loading and movable, sortable headers, used on 6 screens.',
        'Maintain a React Native app for a UK trade association (8,000+ users): App Store and Google Play releases, login with token refresh, Firebase Analytics, Crashlytics and Jest tests, on AWS Lambda, RDS PostgreSQL, S3 and SQS.',
        'Built Azure DevOps CI/CD pipelines with Bicep for infrastructure, and maintain a configuration engine so business rules change without a deployment.',
        'Review code, mentor developers, and lead the front-end work in React and in Vue with TypeScript.',
      ],
      stack: ['C#', '.NET Core', 'EF Core', 'SQL Server', 'React', 'Vue', 'TypeScript', 'React Native', 'Azure', 'AWS', 'Power Automate', 'xUnit'],
    },
    {
      title: 'Software Engineer',
      company: 'Greybeard',
      start: 'Aug 2023',
      end: 'Jan 2024',
      summary: 'Fan Constructor, Halifax Fan’s ASP.NET MVC quoting tool used by its 30+ sales staff.',
      highlights: [
        'Implemented costing in Fan Constructor and worked on its pricing module, which calculates prices from rules and the latest data.',
        'Integrated SAP Business One (ERP) for inventory and order processing, and fixed day-to-day issues.',
      ],
      stack: ['C#', 'ASP.NET MVC', 'SQL Server', 'SAP Business One'],
    },
    {
      title: 'Full-Stack Developer',
      company: 'Caterpillhers',
      start: 'Sep 2022',
      end: 'Aug 2023',
      summary: 'Designed, built and launched a web app solo, reaching 500 sign-ups.',
      highlights: [
        'Designed, built and launched a Node.js and Angular web app on my own.',
        'Built the Express.js REST API, with JWT authentication and data validation.',
      ],
      stack: ['Node.js', 'Express', 'Angular', 'JWT'],
    },
    {
      title: 'Assistant Manager (Tech)',
      company: 'NESCOM',
      start: 'Jul 2020',
      end: 'Jun 2022',
      summary: 'Safety-critical aerospace software.',
      highlights: [
        'Built the C# WPF desktop front end used to fly and monitor drones.',
        'System testing and QA on safety-critical aerospace systems, against technical specifications and safety standards.',
      ],
      stack: ['C#', 'WPF', 'QA'],
    },
  ],
  skills: [
    { name: 'Languages', items: ['C#', 'TypeScript', 'JavaScript', 'SQL', 'Python'] },
    {
      name: 'Back end',
      items: ['.NET Core', 'ASP.NET MVC', 'Node.js', 'REST APIs', 'Event-driven workflows', 'Systems integration', 'Multi-tenancy'],
    },
    { name: 'Front end & mobile', items: ['React', 'Vue', 'Angular', 'React Native', 'WPF'] },
    { name: 'Data', items: ['SQL Server', 'PostgreSQL', 'Stored procedures', 'Entity Framework'] },
    {
      name: 'Cloud & tools',
      items: ['Azure', 'Azure DevOps', 'Bicep', 'Power Automate', 'AWS Lambda, RDS, SQS, S3', 'AWS CDK', 'CI/CD', 'Docker'],
    },
    { name: 'Testing & practices', items: ['xUnit', 'Jest', 'Git', 'SOLID', 'Design patterns', 'Code review', 'Agile'] },
  ],
  education: [
    {
      degree: 'BS Computer Science',
      honours: 'Magna Cum Laude',
      school: 'FAST National University of Computer and Emerging Sciences, Islamabad',
      graduated: 'Jul 2020',
    },
  ],
};
