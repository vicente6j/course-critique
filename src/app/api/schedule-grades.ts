'use server'

import { PROD_ENDPOINT } from "../endpoints";

export interface ScheduleGrade {
  schedule_id: string;
  term: string;
  entry_id: number;
  grade: string;
  grade_updated_at: string | null;
}

export const createScheduleGrade = async (
  scheduleId: string, 
  term: string, 
  entryId: number,
  grade: string,
): Promise<void> => {
  const response = await fetch(`${PROD_ENDPOINT}/schedules/grades`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      action: 'create',
      scheduleId: scheduleId,
      term: term,
      entryId: entryId,
      grade: grade
    }),
  });
  if (!response.ok) {
    throw new Error(
      `Failed to create schedule grade ${grade} for schedule with ID ${scheduleId} and entry ${entryId} 
      (only happening for term ${term}).
      Status: ${response.status}.`
    );
  }
}

export const fetchGrades = async (
  userId: string
): Promise<ScheduleGrade[]> => {
  const response = await fetch(`${PROD_ENDPOINT}/schedules/grades`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      userId: userId,
      action: 'list'
    }),
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error(
      `Failed to fetch schedule grades for user with ID ${userId}. 
      Status: ${response.status}.`);
  }
  return response.json();
}

export const updateScheduleGrade = async (
  scheduleId: string, 
  term: string, 
  entryId: number, 
  grade: string
): Promise<void> => {
  const response = await fetch(`${PROD_ENDPOINT}/schedules/grades`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      scheduleId: scheduleId,
      term: term,
      entryId: entryId,
      grade: grade
    }),
  });
  if (!response.ok) {
    throw new Error(
      `Failed to update schedule grade for schedule ID ${scheduleId}, entry ID ${entryId}, and term ${term}. 
      Status: ${response.status}.`
    );
  }
}

export const deleteScheduleGrade = async (
  scheduleId: string, 
  term: string, 
  entryId: number
): Promise<void> => {
  const response = await fetch(`${PROD_ENDPOINT}/schedules/grades`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      scheduleId: scheduleId,
      term: term,
      entryId: entryId,
    }),
  });
  if (!response.ok) {
    throw new Error(`
      Failed to delete schedule grade for schedule with ID ${scheduleId} and entry ${entryId}. 
      Status: ${response.status}.`);
  }
}

