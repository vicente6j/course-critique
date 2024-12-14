'use server'

import { ALL_COURSE_AVERAGES_BY_PROF_JSON, ALL_COURSE_AVERAGES_BY_TERM_JSON, ALL_COURSE_AVERAGES_JSON, COURSE_INFO_JSON } from "@/app/endpoints";

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

export interface CourseAveragesByProf {
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
  last_updated?: string;
}

/**
 * No cache requires validation each time, but can still
 * take advantage of caching.
 * @returns 
 */
export const fetchCourseAverages = async (): Promise<CourseAverages[]> => {
  const res = await fetch(ALL_COURSE_AVERAGES_JSON, {
    cache: 'default'
  });
  if (!res.ok) {
    throw new Error('Could not fetch course averages');
  }
  return res.json();
}

export const fetchCourseAveragesByProf = async (): Promise<CourseAveragesByProf[]> => {
  const res = await fetch(ALL_COURSE_AVERAGES_BY_PROF_JSON, {
    cache: 'default'
  });
  if (!res.ok) {
    throw new Error('Could not fetch course averages');
  }
  return res.json();
}

export const fetchCourseAveragesByTerm = async (): Promise<CourseAveragesByTerm[]> => {
  /** Hit our endpoint every time upon a server request */
  const res = await fetch(ALL_COURSE_AVERAGES_BY_TERM_JSON, {
    cache: 'default'
  });
  if (!res.ok) {
    throw new Error('Could not fetch course averages');
  }
  return res.json();
}

export const fetchCourseInfo = async (): Promise<CourseInfo[]> => {
  const res = await fetch(COURSE_INFO_JSON, {
    cache: 'default'
  });
  if (!res.ok) {
    throw new Error('Could not fetch course averages');
  }
  return res.json();
}