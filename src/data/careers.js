/**
 * Canonical career catalog — used by recommendation engine and public API.
 */
const CAREERS = [
  {
    slug: 'data-scientist',
    title: 'Data Scientist',
    keywords: ['python', 'machine learning', 'data', 'statistics', 'ml', 'ai', 'analytics', 'tensorflow', 'numpy', 'pandas', 'r language', 'deep learning'],
    description: 'Use data and statistical methods to solve complex business problems and build predictive models.',
    path: ['Learn Python & Statistics basics', 'Master Pandas, NumPy, Matplotlib', 'Study Machine Learning (scikit-learn)', 'Build projects on Kaggle', 'Learn Deep Learning (TensorFlow/PyTorch)', 'Earn Google or AWS ML Certification']
  },
  {
    slug: 'software-developer',
    title: 'Software Developer',
    keywords: ['coding', 'programming', 'javascript', 'java', 'c++', 'c#', 'software', 'web', 'app', 'react', 'node', 'python', 'algorithms', 'data structures'],
    description: 'Design, develop, and maintain software applications for various platforms including web and mobile.',
    path: ['Master a programming language (Python/Java/JS)', 'Study Data Structures & Algorithms', 'Learn version control (Git/GitHub)', 'Build 3–5 personal projects', 'Learn system design basics', 'Apply for internships & entry-level roles']
  },
  {
    slug: 'ui-ux-designer',
    title: 'UI/UX Designer',
    keywords: ['ui', 'ux', 'design', 'figma', 'sketch', 'photoshop', 'illustrator', 'user experience', 'interface', 'graphic', 'creative', 'wireframe', 'prototype'],
    description: 'Create intuitive, visually appealing user interfaces and experiences for digital products.',
    path: ['Learn Design Principles & Color Theory', 'Master Figma or Adobe XD', 'Study User Research & Usability Testing', 'Build a design portfolio (5+ case studies)', 'Learn HTML/CSS basics for developer handoff', 'Apply for junior design roles']
  },
  {
    slug: 'cybersecurity-analyst',
    title: 'Cybersecurity Analyst',
    keywords: ['security', 'cyber', 'network', 'hacking', 'ethical hacking', 'firewall', 'linux', 'penetration testing', 'ctf', 'encryption', 'infosec', 'kali'],
    description: 'Protect organizations from cyber threats by monitoring systems and implementing security measures.',
    path: ['Learn Networking Fundamentals (OSI, TCP/IP)', 'Study Linux & Operating Systems', 'Earn CompTIA Security+ certification', 'Practice ethical hacking on TryHackMe/HackTheBox', 'Learn SIEM tools & incident response', 'Pursue CEH or CISSP certification']
  },
  {
    slug: 'cloud-engineer',
    title: 'Cloud Engineer',
    keywords: ['cloud', 'aws', 'azure', 'gcp', 'devops', 'docker', 'kubernetes', 'infrastructure', 'deployment', 'ci/cd', 'terraform', 'linux', 'serverless'],
    description: 'Build and manage scalable cloud infrastructure and deployment pipelines for modern applications.',
    path: ['Learn Linux & Networking fundamentals', 'Get AWS Cloud Practitioner certification', 'Study Docker & containerization', 'Master Kubernetes orchestration', 'Learn Infrastructure as Code (Terraform)', 'Earn AWS Solutions Architect certification']
  },
  {
    slug: 'full-stack-developer',
    title: 'Full Stack Developer',
    keywords: ['full stack', 'html', 'css', 'javascript', 'react', 'node', 'express', 'api', 'database', 'sql', 'mongodb', 'web development', 'frontend', 'backend'],
    description: 'Build complete web applications handling both frontend UI and backend server-side logic.',
    path: ['Master HTML, CSS, JavaScript', 'Learn React or Vue.js (frontend)', 'Study Node.js & Express (backend)', 'Learn SQL & NoSQL databases', 'Build 3 full-stack projects', 'Deploy apps using Vercel, Railway, or AWS']
  },
  {
    slug: 'ai-ml-engineer',
    title: 'AI / ML Engineer',
    keywords: ['artificial intelligence', 'deep learning', 'neural network', 'nlp', 'computer vision', 'pytorch', 'transformers', 'llm', 'generative ai', 'gpt', 'bert'],
    description: 'Design and implement cutting-edge AI systems including language models, vision systems, and neural networks.',
    path: ['Master Python & Mathematics (Linear Algebra, Calculus)', 'Study Deep Learning fundamentals', 'Learn PyTorch or TensorFlow', 'Work on NLP or Computer Vision projects', 'Study MLOps & model deployment', 'Contribute to open-source AI projects or publish research']
  },
  {
    slug: 'business-analyst',
    title: 'Business Analyst',
    keywords: ['business', 'analysis', 'excel', 'finance', 'reporting', 'requirements', 'process', 'economics', 'accounting', 'bi', 'power bi', 'tableau', 'sql'],
    description: 'Bridge the gap between business goals and technology solutions through data analysis and process mapping.',
    path: ['Learn Excel & SQL for data analysis', 'Study Business Analysis frameworks (BABOK)', 'Master BI tools (Power BI or Tableau)', 'Learn requirements elicitation techniques', 'Get CBAP or PMI-PBA certification', 'Practice with real-world case studies']
  },
  {
    slug: 'mobile-app-developer',
    title: 'Mobile App Developer',
    keywords: ['mobile', 'android', 'ios', 'swift', 'kotlin', 'flutter', 'react native', 'app development', 'xcode', 'dart', 'play store', 'app store'],
    description: 'Develop mobile applications for Android and iOS platforms used by millions of people worldwide.',
    path: ['Choose: iOS (Swift) or Android (Kotlin)', 'Learn Flutter or React Native for cross-platform', 'Study mobile UI/UX design patterns', 'Build and publish apps to app stores', 'Learn mobile security & performance optimization', 'Study app monetization strategies']
  },
  {
    slug: 'product-manager',
    title: 'Product Manager',
    keywords: ['product', 'management', 'strategy', 'agile', 'scrum', 'roadmap', 'stakeholder', 'market research', 'leadership', 'user stories', 'sprint'],
    description: 'Lead cross-functional teams to define, prioritize, and deliver products that solve real user problems.',
    path: ['Study Product Management fundamentals', 'Learn Agile & Scrum methodologies', 'Practice data-driven decision making', 'Build and launch a side project', 'Get PSPO or Pragmatic Institute certification', 'Network and apply for APM / junior PM roles']
  }
];

function getCareerBySlug(slug) {
  return CAREERS.find(c => c.slug === slug) || null;
}

function getCareerByTitle(title) {
  return CAREERS.find(c => c.title === title) || null;
}

module.exports = { CAREERS, getCareerBySlug, getCareerByTitle };
