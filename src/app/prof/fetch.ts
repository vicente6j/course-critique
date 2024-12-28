import { Prof } from '../server-contexts/prof';
import { movingAverages, SectionData, SectionDataTruncated } from '../course/fetch';
import { PROD_DATA_ENDPOINT } from '../endpoints';

/**
 * Import SectionData interface for raw[] from ../course/fetch.
 * Import Prof interface for info from ../contexts/prof.
 * Import SectionDataTruncated for compiled term data from ../course/fetch.
 * Import movingAverages for compiling averages from ../course/fetch.
 */
export interface RelatedProf {
  prof_two: string;
  similarity_score: number | null;
}

export const courseNumsToEscape: string[] = ['2699', '4699', '2698', '4698', '9000', '7000', 'R', 'X', 'L', '8001'];

export interface ProfResponse {
  raw: SectionData[];
  info: Prof[];
  related_profs: RelatedProf[]; 
}

export interface CompiledProfResponse {
  prof_id: string;
  terms: Set<string>;
  sections: Set<string>;
  course_ids: Set<string>;
  total_enrollment: number;
  A: number | null;
  B: number | null;
  C: number | null;
  D: number | null;
  F: number | null;
  W: number | null;
  GPA: number | null;
}

export interface CompiledCourse {
  course_id: string;
  sections: Set<string>;
  terms: Set<string>;
  total_enrollment: number;
  A: number | null;
  B: number | null;
  C: number | null;
  D: number | null;
  F: number | null;
  W: number | null;
  GPA: number | null;
}

export interface ProfTermData {
  term: string;
  total_enrollment: number;
  A: number | null;
  B: number | null;
  C: number | null;
  D: number | null;
  F: number | null;
  W: number | null;
  GPA: number | null;
  courses: CompiledCourse[];
  sections: Map<string, SectionDataTruncated[]> | null;
}

export interface ProfHistory {
  terms: ProfTermData[];
}

const fetchProf = async (profID: string): Promise<ProfResponse> => {
  const response = await fetch(`${PROD_DATA_ENDPOINT}/prof?profID=${encodeURIComponent(profID)}&v=new`);
  if (!response.ok) {
    throw new Error('Failed to fetch course data');
  }
  return await response.json();
};

const compileAverages = (profDetails: ProfResponse): CompiledProfResponse => {
  let res: CompiledProfResponse = {
    prof_id: profDetails.raw[0].instructor_id, 
    terms: new Set(),
    sections: new Set(),
    course_ids: new Set(),
    total_enrollment: 0,
    A: null,
    B: null,
    C: null,
    D: null,
    F: null,
    W: null,
    GPA: null
  };
  for (const section of profDetails.raw) {
    /** Don't consider any courses which are recitations, have X, etc. */
    const courseNum = section.course_id.split(' ')[1];
    if (courseNumsToEscape.some(num => courseNum.includes(num)) || section.enrollment < 3 || section.U || section.V || section.S) {
      continue; 
    }
    for (const grade of movingAverages) {
      if (res[grade] == null) {
        res[grade] = section[grade];
      } else {
        const cur = res[grade] * res.total_enrollment;
        const newVal = section[grade] == null ? 0 : section[grade];
        res[grade] = (cur + newVal * section.enrollment) / (res.total_enrollment + section.enrollment);
      }
    }
    res.course_ids.add(section.course_id);
    res.sections.add(section.section);
    res.terms.add(section.term);
    res.total_enrollment += section.enrollment;
  }
  return res;
}

/**
 * I'm quite certain we need to compile this data separately, even if we have
 * compiledProfs from ../course/fetch. CompiledProfs belongs to singular course ID,
 * but as professors can teach mutliple courses, we're separately interested in 
 * the average GPAs for a professor in a wide dispersal of courses.
 * 
 * We can probably fetch all compiledProfs from ../course/fetch to do this, but this works
 * fine.
 * @param profDetails 
 * @returns compiled array of average grades on a course for each course the professor taught
 */
const compileCourses = (profDetails: ProfResponse): CompiledCourse[] => {
  let res: Map<string, CompiledCourse> = new Map();
  for (const section of profDetails.raw) {
    /** Don't consider any courses which are recitations, have X, etc. */
    const courseNum = section.course_id.split(' ')[1];
    if (courseNumsToEscape.some(num => courseNum.includes(num)) || section.enrollment < 3 || section.U || section.V || section.S) {
      continue; 
    }
    let course_id: string = section.course_id;
    if (!res.has(course_id)) {
      res.set(course_id, {
        course_id: course_id,
        sections: new Set(),
        terms: new Set(),
        total_enrollment: 0,
        A: null,
        B: null,
        C: null,
        D: null,
        F: null,
        W: null,
        GPA: null, 
      });
    }
    const course = res.get(course_id)!;
    for (const grade of movingAverages) {
      if (course[grade] == null) {
        course[grade] = section[grade];
      } else {
        const cur = course[grade] * course.total_enrollment;
        const newVal = section[grade] == null ? 0 : section[grade];
        course[grade] = (cur + newVal * section.enrollment) / (course.total_enrollment + section.enrollment);
      }
    }
    course.terms.add(section.term);
    course.sections.add(section.section);
    course.total_enrollment += section.enrollment;
  }
  return Array.from(res.values());
}

const compileHistory = (profDetails: ProfResponse): ProfHistory => {
  let res: ProfHistory = { terms: [] };
  let map: Map<string, ProfTermData> = new Map();
  let courseMap: Map<string, Map<string, CompiledCourse>> = new Map();
  let sectionMap: Map<string, Map<string, SectionDataTruncated[]>> = new Map();

  for (const section of profDetails.raw) {
    /** Don't consider any courses which are recitations, have X, etc. */
    const courseNum = section.course_id.split(' ')[1];
    if (courseNumsToEscape.some(num => courseNum.includes(num)) || section.enrollment < 3 || section.U || section.V || section.S) {
      continue; 
    }
    let term = section.term;
    if (!map.has(term)) {
      map.set(term, {
        term: term,
        total_enrollment: 0,
        A: null,
        B: null,
        C: null,
        D: null,
        F: null,
        W: null,
        GPA: null,
        courses: [],
        sections: new Map(),
      });
    }
    if (!courseMap.has(term)) {
      courseMap.set(term, new Map());
    }
    if (!sectionMap.has(term)) {
      sectionMap.set(term, new Map());
    }
    let relCourse = section.course_id;
    /** Prepare averages for the given course in the term. */
    if (!courseMap.get(term)!.has(relCourse)) {
      courseMap.get(term)!.set(relCourse, {
        course_id: relCourse,
        sections: new Set(),
        terms: new Set(),
        total_enrollment: 0,
        A: null,
        B: null,
        C: null,
        D: null,
        F: null,
        W: null,
        GPA: null, 
      });
    }
    if (!sectionMap.get(term)?.has(relCourse)) {
      sectionMap.get(term)!.set(relCourse, []);
    }

    const profTermData = map.get(term)!;
    const course = courseMap.get(term)!.get(relCourse)!;
    const sections = sectionMap.get(term)!.get(relCourse)!;
    /** 
     * Compute overall term data for each letter grade (not super relevant to compute but it's probably OK).
     * e.g. Fall 2023 -> A: 27.1, B: 32.1, ...
     */
    for (const grade of movingAverages) {
      if (profTermData[grade] == null) {
        profTermData[grade] = section[grade];
      } else {
        const cur = profTermData[grade] * profTermData.total_enrollment;
        const newVal = section[grade] == null ? 0 : section[grade];
        profTermData[grade] = (cur + newVal * section.enrollment) / (profTermData.total_enrollment + section.enrollment);
      }
    }
    /** 
     * Compute overall term data for individual courses, for each letter grade.
     * e.g. Fall 2023 -> ACCT 2101 -> A: 27.1, B: 32.1, ...
     */
    for (const grade of movingAverages) {
      if (course[grade] == null) {
        course[grade] = section[grade];
      } else {
        const cur = course[grade] * course.total_enrollment;
        const newVal = section[grade] == null ? 0 : section[grade];
        course[grade] = (cur + newVal * section.enrollment) / (course.total_enrollment + section.enrollment);
      }
    }
    /** 
     * Lastly, just add the truncated section to the sections array.
     */
    sections.push({
      section: section['section'],
      A: section['A'],
      B: section['B'],
      C: section['C'],
      D: section['D'],
      F: section['F'],
      W: section['W'],
      GPA: section['GPA'],
      enrollment: section['enrollment']
    });
    profTermData.total_enrollment += section.enrollment;
    course.terms.add(section.term);
    course.sections.add(section.section);
    course.total_enrollment += section.enrollment;
  }

  for (const term of map.keys()) {
    map.get(term)!.courses = Array.from(courseMap.get(term)!.values());
    map.get(term)!.sections = sectionMap.get(term)!;
  }

  res.terms = Array.from(map.values());
  return res;
}

export interface ProfFetchProps {
  compiledCourses: CompiledCourse[];
  compiledProfResponse: CompiledProfResponse;
  info: Prof;
  related_profs: RelatedProf[];
  profHistory: ProfHistory;
}

const profCache: Record<string, ProfFetchProps> = {};

/**
 * A detail here is that we're using in-memory caching, since for our purposes
 * we don't really have to cache between reloads for individual PROFS a user is looking at (in this case).
 * Upon reloading, then we reset cache.
 * @param courseID Course ID to be queried.
 * @returns A collection of the compiled prof resonse, total compiled response, and course info.
 */
const profFetch = async (profID: string): Promise<ProfFetchProps> => {

  if (profCache[profID]) {
    return profCache[profID];
  }

  let profDetails: ProfResponse;
  let compiledProfResponse: CompiledProfResponse;
  let compiledCourses: CompiledCourse[];
  let info: Prof;
  let related_profs: RelatedProf[];
  let profHistory: ProfHistory;

  try {
    profDetails = await fetchProf(profID);
    compiledProfResponse = compileAverages(profDetails);
    compiledCourses = compileCourses(profDetails);
    info = profDetails.info[0];
    related_profs = profDetails.related_profs;
    profHistory = compileHistory(profDetails);

    profCache[profID] = { compiledCourses, compiledProfResponse, info, related_profs, profHistory };

  } catch (e) {
    throw new Error("Failed to fetch and compile course data.");
  }

  return { compiledCourses, compiledProfResponse, info, related_profs, profHistory };
};

export default profFetch;