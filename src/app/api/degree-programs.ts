import { ALL_DEGREE_PROGRAMS_JSON, ALL_DEGREE_REQUIREMENTS_JSON } from "../endpoints";

export interface DegreeProgram {
  id: string;
  name: string;
  overview: string;
  total_credits: number;
  link: string;
}

export interface DegreeProgramRequirement {
  program_id: string;
  option: number;
  core_area: string | null;
  course_id: string | null;
  or_group: number;
  description: string | null;
  description_credits: number | null;
}

export const fetchDegreePrograms = async (): Promise<DegreeProgram[]> => {
  /** Hit our endpoint every time upon a server request */
  const res = await fetch(ALL_DEGREE_PROGRAMS_JSON, {
    cache: 'default'
  });
  if (!res.ok) {
    throw new Error('Could not fetch degree programs.');
  }
  return res.json();
}

export const fetchDegreeProgramRequirements = async (): Promise<DegreeProgramRequirement[]> => {
  const res = await fetch(ALL_DEGREE_REQUIREMENTS_JSON, {
    cache: 'default'
  });
  if (!res.ok) {
    throw new Error('Could not fetch degree requirements.');
  }
  return res.json();
}