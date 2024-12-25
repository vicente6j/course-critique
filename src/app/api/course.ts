'use server'

import { ALL_COURSE_AVERAGES_BY_PROF_JSON, ALL_COURSE_AVERAGES_BY_TERM_JSON, ALL_COURSE_AVERAGES_JSON, COURSE_INFO_JSON, MOCK_COURSE_AVERAGES_BY_PROF_JSON, MOCK_COURSE_AVERAGES_BY_TERM_JSON, MOCK_COURSE_AVERAGES_JSON, MOCK_COURSE_INFO_JSON } from "@/app/endpoints";

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
  if (process.env.NODE_ENV === 'development') {
    const URL = 
      type === 'averages' ? MOCK_COURSE_AVERAGES_JSON 
      : type === 'byProf' ? MOCK_COURSE_AVERAGES_BY_PROF_JSON 
      : MOCK_COURSE_AVERAGES_BY_TERM_JSON;

    const res = await fetch(URL, { 
      cache: 'force-cache' 
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch course ${type}: ${res.status}`);
    }
    return res.json();
  }

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
  if (process.env.NODE_ENV === 'development') {
    const res = await fetch(MOCK_COURSE_INFO_JSON, { 
      cache: 'force-cache' 
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch course information: ${res.status}`);
    }
    return res.json();
  }
  
  const res = await fetch(COURSE_INFO_JSON, {
    cache: 'force-cache'
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch course information: ${res.status}`);
  }
  return res.json();
}