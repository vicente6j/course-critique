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

/**
 * 'Force-cache' doesn't persist across builds, but once built and deployed it remains
 * available to all users. This allows subsequent users of the website to 
 * not see any latency at all upon going on the page and attempting to see degree
 * programs in, for example, a context.
 * @returns Degree Programs list.
 */
export const fetchDegreePrograms = async (): Promise<DegreeProgram[]> => {
  return [];
  // if (process.env.NODE_ENV === 'development') {
  //   const res = await fetch(MOCK_DEGREE_PROGRAMS_JSON, { 
  //     cache: 'force-cache' 
  //   });
  //   if (!res.ok) {
  //     throw new Error(`Failed to fetch degree programs: ${res.status}`);
  //   }
  //   return res.json();
  // }

  // const res = await fetch(ALL_DEGREE_PROGRAMS_JSON, {
  //   cache: 'force-cache'
  // });
  // if (!res.ok) {
  //   throw new Error(`Could not fetch degree programs. Error: ${res.status}`);
  // }
  // return res.json();
}

export const fetchDegreeProgramRequirements = async (): Promise<DegreeProgramRequirement[]> => {
  if (process.env.NODE_ENV === 'development') {
    return [];
  }
  const res = await fetch(ALL_DEGREE_REQUIREMENTS_JSON, {
    cache: 'force-cache'
  });
  if (!res.ok) {
    throw new Error(`Could not fetch degree requirements. Error: ${res.status}`);
  }
  return res.json();
}