export interface ResumeData {
  name: string;
  email: string;
  phone: string;
  summary: string;
  skills: string[];
  experience: {
    company: string;
    role: string;
    duration: string;
    description: string[];
  }[];
  projects: {
    title: string;
    description: string[];
  }[];
  education: {
    institution: string;
    degree: string;
    duration: string;
  }[];
}