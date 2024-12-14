'use server'

import { ALL_COURSE_AVERAGES_BY_PROF_JSON, ALL_COURSE_AVERAGES_BY_TERM_JSON, ALL_COURSE_AVERAGES_JSON, ALL_PROF_AVERAGES_BY_COURSE_JSON, ALL_PROF_AVERAGES_BY_TERM_JSON, ALL_PROF_AVERAGES_JSON, COURSE_INFO_JSON, HOT_COURSES_JSON, PROF_INFO_JSON } from "@/app/endpoints";

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

export const fetchProfAverages = async (): Promise<ProfAverages[]> => {
  const res = await fetch(ALL_PROF_AVERAGES_JSON, {
    cache: 'default'
  });
  if (!res.ok) {
    throw new Error('Could not fetch prof averages.');
  }
  return res.json();
}

export const fetchProfAveragesByCourse = async (): Promise<ProfAveragesByCourse[]> => {
  const res = await fetch(ALL_PROF_AVERAGES_BY_COURSE_JSON, {
    cache: 'default'
  });
  if (!res.ok) {
    throw new Error('Could not fetch prof averages by course.');
  }
  return res.json();
}

export const fetchProfAveragesByTerm = async (): Promise<ProfAveragesByTerm[]> => {
  const res = await fetch(ALL_PROF_AVERAGES_BY_TERM_JSON, {
    cache: 'default'
  });
  if (!res.ok) {
    throw new Error('Could not fetch prof averages by term.');
  }
  return res.json();
}

export const fetchProfInfo = async (): Promise<AllProfResponse> => {
  const res = await fetch(PROF_INFO_JSON, {
    cache: 'default'
  });
  if (!res.ok) {
    throw new Error('Could not fetch professor information.');
  }
  return res.json();
}

export const fetchProfHotCourses = async (): Promise<HotResponse[]> => {
  const res = await fetch(HOT_COURSES_JSON, {
    cache: 'default'
  });
  if (!res.ok) {
    throw new Error('Could not fetch hot courses.');
  }
  return res.json();
}