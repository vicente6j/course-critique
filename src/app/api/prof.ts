'use server'

import { COURSE_AVERAGES_BY_PROF_JSON, COURSES_TAUGHT_BY_TERM_JSON, MOCK_COURSE_AVERAGES_BY_PROF_JSON, MOCK_COURSES_TAUGHT_BY_TERM_JSON, MOCK_PROF_AVERAGES_BY_TERM_JSON, MOCK_PROF_AVERAGES_JSON, PROF_AVERAGES_BY_TERM_JSON, PROF_AVERAGES_JSON, PROF_INFO_JSON } from "../endpoints";

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

export interface CourseAveragesByProf {
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

export interface CoursesTaughtByTerm {
  prof_id: string;
  term: string;
  courses_taught: string[];
}

export const fetchProfInfo = async (): Promise<ProfInfo[]> => {
  const res = await fetch(PROF_INFO_JSON, {
    cache: 'force-cache'
  });
  if (!res.ok) {
    throw new Error(`Could not fetch prof info: ${res.status}`);
  }
  return res.json();
}

export const fetchProfAverages = async (): Promise<ProfAverages[]> => {
  const dataSource = process.env.NEXT_PUBLIC_USE_MOCK_DATA ? MOCK_PROF_AVERAGES_JSON : PROF_AVERAGES_JSON;
  const res = await fetch(dataSource, {
    cache: 'force-cache',
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch prof averages: ${res.status}`);
  }
  return res.json();
}

export const fetchProfAveragesByTerm = async (): Promise<ProfAveragesByTerm[]> => {
  const dataSource = process.env.NEXT_PUBLIC_USE_MOCK_DATA ? MOCK_PROF_AVERAGES_BY_TERM_JSON : PROF_AVERAGES_BY_TERM_JSON;
  const res = await fetch(dataSource, {
    cache: 'force-cache',
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch prof averages (by term): ${res.status}`);
  }
  return res.json();
}

export const fetchCourseAveragesByProf = async (): Promise<CourseAveragesByProf[]> => {
  const dataSource = process.env.NEXT_PUBLIC_USE_MOCK_DATA ? MOCK_COURSE_AVERAGES_BY_PROF_JSON : COURSE_AVERAGES_BY_PROF_JSON;
  const res = await fetch(dataSource, {
    cache: 'force-cache',
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch course averages by prof: ${res.status}`);
  }
  return res.json();
}

export const fetchCoursesTaughtByTerm = async (): Promise<CoursesTaughtByTerm[]> => {
  const dataSource = process.env.NEXT_PUBLIC_USE_MOCK_DATA ? MOCK_COURSES_TAUGHT_BY_TERM_JSON : COURSES_TAUGHT_BY_TERM_JSON;
  const res = await fetch(dataSource, {
    cache: 'force-cache',
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch course averages by prof: ${res.status}`);
  }
  return res.json();
}