'use server'

import { COURSE_AVERAGES_BY_TERM_JSON, COURSE_AVERAGES_JSON, COURSE_INFO_JSON, MOCK_COURSE_AVERAGES_BY_TERM_JSON, MOCK_COURSE_AVERAGES_JSON, MOCK_PROF_AVERAGES_BY_COURSE_JSON, PROF_AVERAGES_BY_COURSE } from "../endpoints";

export interface CourseAverages {
  course_id: string;
  A: number | null;
  B: number | null;
  C: number | null;
  D: number | null;
  F: number | null;
  W: number | null;
  GPA: number | null;
}

export interface ProfAveragesByCourse {
  course_id: string;
  prof_id: string;
  A: number | null;
  B: number | null;
  C: number | null;
  D: number | null;
  F: number | null;
  W: number | null;
  GPA: number | null;
  total: number | null;
}

export interface CourseAveragesByTerm {
  term: string;
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

export interface CourseInfo {
  id: string;
  course_name: string;
  credits: number;
  description: string;
  last_updated: string | null;
}

/**
 * Utilize COURSE_INFO_JSON for both mock and non mock purposes.
 * @returns CourseInfo array.
 */
export const fetchCourseInfo = async (): Promise<CourseInfo[]> => {
  console.log('fetching course info');
  const res = await fetch(COURSE_INFO_JSON, {
    cache: 'force-cache',
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch course information: ${res.status}`);
  }
  return res.json();
}

export const fetchCourseAverages = async (): Promise<CourseAverages[]> => {
  console.log('fetching course averages');
  const dataSource = process.env.NEXT_PUBLIC_USE_MOCK_DATA ? MOCK_COURSE_AVERAGES_JSON : COURSE_AVERAGES_JSON;
  console.log(dataSource);
  const res = await fetch(dataSource, {
    cache: 'force-cache',
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch course averages: ${res.status}`);
  }
  return res.json();
}

export const fetchCourseAveragesByTerm = async (): Promise<CourseAveragesByTerm[]> => {
  console.log('fetching course averages by term');
  const dataSource = process.env.NEXT_PUBLIC_USE_MOCK_DATA ? MOCK_COURSE_AVERAGES_BY_TERM_JSON : COURSE_AVERAGES_BY_TERM_JSON;
  const res = await fetch(dataSource, {
    cache: 'force-cache',
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch course data by term: ${res.status}`);
  }
  return res.json();
}

export const fetchProfAveragesByCourse = async (): Promise<ProfAveragesByCourse[]> => {
  console.log('fetching prof averages by course');
  const dataSource = process.env.NEXT_PUBLIC_USE_MOCK_DATA ? MOCK_PROF_AVERAGES_BY_COURSE_JSON : PROF_AVERAGES_BY_COURSE;
  const res = await fetch(dataSource, {
    cache: 'force-cache',
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch course data by term: ${res.status}`);
  }
  return res.json();
}