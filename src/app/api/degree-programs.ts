import { DEGREE_PROGRAMS_JSON, DEGREE_REQUIREMENTS_JSON, MOCK_DEGREE_PROGRAMS_JSON, MOCK_DEGREE_REQUIREMENTS_JSON, MOCK_PROGRAM_AVERAGES_BY_TERM_JSON, PROGRAM_AVERAGES_BY_TERM_JSON } from "../endpoints";

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

export interface DegreeProgramAveragesByTerm {
  program: string;
  term: string;
  A: number | null;
  B: number | null;
  C: number | null;
  D: number | null;
  F: number | null;
  W: number | null;
  GPA: number | null;
  enrollment: number | null;
}

/**
 * 'Force-cache' doesn't persist across builds, but once built and deployed it remains
 * available to all users. This allows subsequent users of the website to 
 * not see any latency at all upon going on the page and attempting to see degree
 * programs in, for example, a context.
 * @returns Degree Programs list.
 */
export const fetchDegreePrograms = async (): Promise<DegreeProgram[]> => {
  const dataSource =  process.env.NEXT_PUBLIC_USE_MOCK_DATA ? MOCK_DEGREE_PROGRAMS_JSON : DEGREE_PROGRAMS_JSON;
  const res = await fetch(dataSource, {
    cache: 'no-store'
  });
  if (!res.ok) {
    throw new Error(`Could not fetch degree programs. Error: ${res.status}`);
  }
  return res.json();
}

export const fetchDegreeProgramRequirements = async (): Promise<DegreeProgramRequirement[]> => {
  const dataSource =  process.env.NEXT_PUBLIC_USE_MOCK_DATA ? MOCK_DEGREE_REQUIREMENTS_JSON : DEGREE_REQUIREMENTS_JSON;
  const res = await fetch(dataSource, {
    cache: 'no-store'
  });
  if (!res.ok) {
    throw new Error(`Could not fetch degree requirements. Error: ${res.status}`);
  }
  return res.json();
}

export const fetchDegreeProgramAveragesByTerm = async (): Promise<DegreeProgramAveragesByTerm[]> => {
  const dataSource =  process.env.NEXT_PUBLIC_USE_MOCK_DATA ? MOCK_PROGRAM_AVERAGES_BY_TERM_JSON : PROGRAM_AVERAGES_BY_TERM_JSON;
  const res = await fetch(dataSource, {
    cache: 'no-store'
  });
  if (!res.ok) {
    throw new Error(`Could not fetch degree requirements. Error: ${res.status}`);
  }
  return res.json();
}