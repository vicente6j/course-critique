'use server'

import { ALL_PROF_AVERAGES_BY_COURSE_JSON, ALL_PROF_AVERAGES_BY_TERM_JSON, ALL_PROF_AVERAGES_JSON, COURSE_INFO_JSON, HOT_COURSES_JSON, MOCK_PROF_AVERAGES_BY_TERM, MOCK_PROF_AVERAGES_JSON, MOCK_PROF_INFO_JSON, MOCK_PROF_TERM_COURSES, PROF_INFO_JSON } from "@/app/endpoints";

export interface ProfAverages {
  prof_id: string;
  A: number | null;
  B: number | null;
  C: number | null;
  D: number | null;
  F: number | null;
  W: number | null;
  GPA: number | null;
}

export interface ProfAveragesByCourse {
  prof_id: string;
  course_id: string;
  A: number | null;
  B: number | null;
  C: number | null;
  D: number | null;
  F: number | null;
  W: number | null;
  GPA: number | null;
  total: number | null;
}

export interface ProfAveragesByTerm {
  prof_id: string;
  term: string;
  A: number | null;
  B: number | null;
  C: number | null;
  D: number | null;
  F: number | null;
  W: number | null;
  GPA: number | null;
  total: number | null;
}

export interface ProfInfo {
  instructor_id: string;
  instructor_name: string;
  instructor_lname: string;
  instructor_fname: string;
  instructor_mname: string | null;
}

export interface AllProfResponse {
  profs: ProfInfo[];
}

export interface HotResponse {
  prof: string;
  hot_course: string;
}

export interface CoursesTaughtByTerm {
  prof_id: string;
  term: string;
  courses_taught: string[];
}

export type DataType = 'averages' | 'byCourse' | 'byTerm';

export const fetchProfData = async (type: DataType) => {
  if (process.env.NEXT_PUBLIC_USE_MOCK_DATA) {
    const URL = type === 'averages' ? MOCK_PROF_AVERAGES_JSON : type === 'byTerm' ? MOCK_PROF_AVERAGES_BY_TERM : '';
    if (URL === '') {
      return [];
    }

    const res = await fetch(URL, { 
      cache: 'force-cache' 
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch professor ${type}: ${res.status}`);
    }
    return res.json();
  }

  const URL = 
    type === 'averages' ? ALL_PROF_AVERAGES_JSON 
    : type === 'byCourse' ? ALL_PROF_AVERAGES_BY_COURSE_JSON 
    : ALL_PROF_AVERAGES_BY_TERM_JSON;

  const res = await fetch(URL, { 
    cache: 'force-cache' 
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch professor ${type}: ${res.status}`);
  }
  return res.json();
}

export const fetchProfInfo = async (): Promise<ProfInfo[]> => {
  if (process.env.NEXT_PUBLIC_USE_MOCK_DATA) {
    const res = await fetch(MOCK_PROF_INFO_JSON, { 
      cache: 'force-cache' 
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch professor information: ${res.status}`);
    }
    return res.json();
  }

  const res = await fetch(PROF_INFO_JSON, {
    cache: 'force-cache'
  });
  if (!res.ok) {
    throw new Error(`Could not fetch professor information: ${res.status}`);
  }
  return res.json();
}

export const fetchProfHotCourses = async (): Promise<HotResponse[]> => {
  if (process.env.NEXT_PUBLIC_USE_MOCK_DATA) {
    return [];
  }
  const res = await fetch(HOT_COURSES_JSON, {
    cache: 'force-cache'
  });
  if (!res.ok) {
    throw new Error(`Could not fetch hot courses: ${res.status}`);
  }
  return res.json();
}

export const fetchProfCoursesTaughtByTerm = async (): Promise<CoursesTaughtByTerm[]> => {
  if (process.env.NEXT_PUBLIC_USE_MOCK_DATA) {
    const res = await fetch(MOCK_PROF_TERM_COURSES, { 
      cache: 'force-cache' 
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch courses taught by term: ${res.status}`);
    }
    return res.json();
  }

  /**
   * To-do: fix this
   */
  const res = await fetch(HOT_COURSES_JSON, {
    cache: 'force-cache'
  });
  if (!res.ok) {
    throw new Error(`Could not fetch courses taught by term: ${res.status}`);
  }
  return res.json();
}