/**
 * Mirrors the backend's `ResumeData` record, field for field.
 *
 * The backend derives the model's JSON schema from that record, so this file
 * and the resume the model produces cannot drift apart without the API payload
 * changing too. Every field is always present — the backend normalizes nulls
 * to empty strings and empty arrays — so nothing here is optional.
 */
export interface ResumeData {
  name: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  summary: string;
  skills: string[];
  experience: {
    company: string;
    role: string;
    location: string;
    duration: string;
    description: string[];
  }[];
  projects: {
    title: string;
    tech: string;
    description: string[];
  }[];
  education: {
    institution: string;
    degree: string;
    duration: string;
  }[];
  certifications: string[];
  /** Shown to the candidate. Never printed on the resume. */
  tailoringNotes: string[];
  /** Job-description keywords the resume genuinely cannot support. */
  missingKeywords: string[];
  /** 0-100 coverage of the posting's stated requirements. */
  matchScore: number;
}
