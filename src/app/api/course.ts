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

export type DataType = 'averages' | 'byProf' | 'byTerm';

export const fetchCourseData = async (type: DataType) => {
  const URL = 
    type === 'averages' ? ALL_COURSE_AVERAGES_JSON 
    : type === 'byProf' ? ALL_COURSE_AVERAGES_BY_PROF_JSON 
    : ALL_COURSE_AVERAGES_BY_TERM_JSON;

  const res = await fetch(URL, { 
    cache: 'force-cache' 
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch course ${type}: ${res.status}`);
  }
  return res.json();
}

export const fetchCourseInfo = async (): Promise<CourseInfo[]> => {
  const res = await fetch(COURSE_INFO_JSON, {
    cache: 'force-cache'
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch course information: ${res.status}`);
  }
  return res.json();
}