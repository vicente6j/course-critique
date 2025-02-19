import { PROD_DATA_ENDPOINT } from '../endpoints';

export interface SectionData {
  term: string;
  course_id: string;
  section: string;
  instructor_id: string;
  enrollment: number;
  A: number | null;
  B: number | null;
  C: number | null;
  D: number | null;
  F: number | null;
  W: number | null;
  GPA: number | null;
  S: number | null;
  U: number | null;
  V: number | null;
  I: number | null;
}

export interface CourseInfo {
  id: string;
  course_name: string;
  credits: number | null;
  description: string;
  last_updated: string;
}

export interface RelatedCourse {
  course_two: string;
  similarity_score: number | null;
}

export interface CourseResponse {
  raw: SectionData[];
  info: CourseInfo[];
  related_courses: RelatedCourse[]; 
}

export interface CompiledResponse {
  course_id: string;
  terms: Set<string>;
  sections: Set<string>;
  instructor_ids: Set<string>;
  total_enrollment: number;
  A: number | null;
  B: number | null;
  C: number | null;
  D: number | null;
  F: number | null;
  W: number | null;
  GPA: number | null;
}

export interface CompiledProf {
  instructor_id: string;
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

export interface TermData {
  term: string;
  total_enrollment: number;
  A: number | null;
  B: number | null;
  C: number | null;
  D: number | null;
  F: number | null;
  W: number | null;
  GPA: number | null;
  profs: CompiledProf[];
  sections: Map<string, SectionDataTruncated[]> | null;
}

export interface SectionDataTruncated {
  section: string;
  enrollment: number;
  A: number | null;
  B: number | null;
  C: number | null;
  D: number | null;
  F: number | null;
  W: number | null;
  GPA: number | null;
}

export interface CourseHistory {
  terms: TermData[];
}

const fetchCourse = async (courseID: string): Promise<CourseResponse> => {
  const response = await fetch(`${PROD_DATA_ENDPOINT}/course?courseID=${encodeURIComponent(courseID)}&v=new`);
  if (!response.ok) {
    throw new Error('Failed to fetch course data');
  }
  return await response.json();
};

type GradeKeys = 'A' | 'B' | 'C' | 'D' | 'F' | 'W' | 'GPA';
export const movingAverages: GradeKeys[] = ['A', 'B', 'C', 'D', 'F', 'W', 'GPA'];

const compileAverages = (courseDetails: CourseResponse): CompiledResponse => {
  let res: CompiledResponse = {
    course_id: courseDetails.raw[0].course_id, 
    terms: new Set(),
    sections: new Set(),
    instructor_ids: new Set(),
    total_enrollment: 0,
    A: null,
    B: null,
    C: null,
    D: null,
    F: null,
    W: null,
    GPA: null
  };
  for (const section of courseDetails.raw) {
    if (section['GPA'] == null) {
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
    res.instructor_ids.add(section.instructor_id);
    res.sections.add(section.section);
    res.terms.add(section.term);
    res.total_enrollment += section.enrollment;
  }
  return res;
}

const compileProfs = (courseDetails: CourseResponse): CompiledProf[] => {
  let res: Map<string, CompiledProf> = new Map();
  for (const section of courseDetails.raw) {
    if (section['GPA'] == null) {
      continue;
    }
    let instructor_id: string = section.instructor_id;
    if (!res.has(instructor_id)) {
      res.set(instructor_id, {
        instructor_id: instructor_id,
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
    const prof = res.get(instructor_id)!;
    for (const grade of movingAverages) {
      if (prof[grade] == null) {
        prof[grade] = section[grade];
      } else {
        const cur = prof[grade] * prof.total_enrollment;
        const newVal = section[grade] == null ? 0 : section[grade];
        prof[grade] = (cur + newVal * section.enrollment) / (prof.total_enrollment + section.enrollment);
      }
    }
    prof.terms.add(section.term);
    prof.sections.add(section.section);
    prof.total_enrollment += section.enrollment;
  }
  return Array.from(res.values());
}

const compileHistory = (courseDetails: CourseResponse): CourseHistory => {
  let res: CourseHistory = { terms: [] };
  let map: Map<string, TermData> = new Map();
  let profMap: Map<string, Map<string, CompiledProf>> = new Map();
  let sectionMap: Map<string, Map<string, SectionDataTruncated[]>> = new Map();

  for (const section of courseDetails.raw) {
    if (section['GPA'] == null) {
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
        profs: [],
        sections: new Map(),
      });
    }
    if (!profMap.has(term)) {
      profMap.set(term, new Map());
    }
    if (!sectionMap.has(term)) {
      sectionMap.set(term, new Map());
    }
    let relProf = section.instructor_id;
    if (!profMap.get(term)!.has(relProf)) {
      profMap.get(term)!.set(relProf, {
        instructor_id: relProf,
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
    if (!sectionMap.get(term)?.has(relProf)) {
      sectionMap.get(term)!.set(relProf, []);
    }
    
    /**
     * Hierarchy is such that termData is the overarching dictionary 
     * which compiles all grade averages for a given term.
     * 
     * Meanwhile, sections just keeps track of all the sections seen so far.
     * 
     * Prof averages keeps track of a given prof's average within a given term.
     */
    const termData = map.get(term)!;
    const prof = profMap.get(term)!.get(relProf)!;
    const sections = sectionMap.get(term)!.get(relProf)!;
    /** 
     * Compute overall term data for each letter grade.
     * e.g. Fall 2023 -> A: 27.1, B: 32.1, ...
     */
    for (const grade of movingAverages) {
      if (termData[grade] == null) {
        termData[grade] = section[grade];
      } else {
        const cur = termData[grade] * termData.total_enrollment;
        const newVal = section[grade] == null ? 0 : section[grade];
        termData[grade] = (cur + newVal * section.enrollment) / (termData.total_enrollment + section.enrollment);
      }
    }
    /** 
     * Compute overall term data for individual profs, for each letter grade.
     * e.g. Fall 2023 -> Mary, HB -> A: 27.1, B: 32.1, ...
     */
    for (const grade of movingAverages) {
      if (prof[grade] == null) {
        prof[grade] = section[grade];
      } else {
        const cur = prof[grade] * prof.total_enrollment;
        const newVal = section[grade] == null ? 0 : section[grade];
        prof[grade] = (cur + newVal * section.enrollment) / (prof.total_enrollment + section.enrollment);
      }
    }
    /** 
     * Lastly, just add the truncated section to the sections array.
     */
    sections.push({
      'section': section['section'],
      'A': section['A'],
      'B': section['B'],
      'C': section['C'],
      'D': section['D'],
      'F': section['F'],
      'W': section['W'],
      'GPA': section['GPA'],
      'enrollment': section['enrollment']
    });
    termData.total_enrollment += section.enrollment;
    prof.terms.add(section.term);
    prof.sections.add(section.section);
    prof.total_enrollment += section.enrollment;
  }

  for (const term of map.keys()) {
    map.get(term)!.profs = Array.from(profMap.get(term)!.values());
    map.get(term)!.sections = sectionMap.get(term)!;
  }

  res.terms = Array.from(map.values());
  return res;
}

export interface CourseFetchAggregate {
  compiledProfs: CompiledProf[];
  compiledResponse: CompiledResponse;
  info: CourseInfo;
  related_courses: RelatedCourse[];
  courseHistory: CourseHistory;
}

const courseCache: Record<string, CourseFetchAggregate> = {};

/**
 * A detail here is that we're using in-memory caching, since for our purposes
 * we don't really have to cache between reloads for individual courses a user is looking at.
 * @param courseID Course ID to be queried.
 * @returns A collection of the compiled prof resonse, total compiled response, and course info.
 */
const courseFetch = async (courseID: string): Promise<CourseFetchAggregate> => {

  if (courseCache[courseID]) {
    return courseCache[courseID];
  }

  let courseDetails: CourseResponse;
  let compiledResponse: CompiledResponse;
  let compiledProfs: CompiledProf[];
  let info: CourseInfo;
  let related_courses: RelatedCourse[];
  let courseHistory: CourseHistory;
  let courseFetchAggregate: CourseFetchAggregate;

  try {
    courseDetails = await fetchCourse(courseID);
    compiledResponse = compileAverages(courseDetails);
    compiledProfs = compileProfs(courseDetails);
    info = courseDetails.info[0];
    related_courses = courseDetails.related_courses;
    courseHistory = compileHistory(courseDetails);

    courseFetchAggregate = { 
      compiledProfs, 
      compiledResponse, 
      info, 
      courseHistory, 
      related_courses 
    };

    courseCache[courseID] = courseFetchAggregate;

  } catch (e) {
    throw new Error("Failed to fetch and compile course data.");
  }

  return courseFetchAggregate;
};

export default courseFetch;