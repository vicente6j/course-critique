'use server'

import { PROD_ENDPOINT } from "../endpoints";

export interface ScheduleEntry {
  schedule_id: string;
  name: string | null;
  created_at: string | null;
  updated_at: string | null;
  entry_id: number;
  course_id: string | null;
  inserted_at: string | null;
}

export const createScheduleEntry = async (scheduleId: string, courseId: string): Promise<void> => {
  const response = await fetch(`${PROD_ENDPOINT}/schedules/entries`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      scheduleId: scheduleId,
      action: 'insert',
      courseId: courseId,
    }),
  });
  if (!response.ok) {
    throw new Error(
      `Failed to create schedule entry ${courseId} for schedule with ID ${scheduleId}. Status: ${response.status}.`
    );
  }
}

export const fetchScheduleEntries = async (userId: string): Promise<ScheduleEntry[]> => {
  const response = await fetch(`${PROD_ENDPOINT}/schedules/entries`, {
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
    throw new Error(`Failed to fetch schedule entries for user with ID ${userId}. Status: ${response.status}.`);
  }
  return response.json();
}

/**
 * The purpose of this update is to simply update the schedule entry with a new course ID,
 * not modify the entryId (unique and monotonic).
 * @param scheduleId ID of modified schedule.
 * @param entryId Monotonic entry ID.
 * @param newCourseId New course ID.
 */
export const updateScheduleEntry = async (scheduleId: string, entryId: number, newCourseId: string): Promise<void> => {
  const response = await fetch(`${PROD_ENDPOINT}/schedules/entries`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      scheduleId: scheduleId,
      entryId: entryId,
      newCourseId: newCourseId
    }),
  });
  if (!response.ok) {
    throw new Error(`Failed to update schedule entry with schedule ID ${scheduleId} and entry ID ${entryId}. Status: ${response.status}.`);
  }
}

export const deleteScheduleEntry = async (scheduleId: string, entryId: number): Promise<void> => {
  const response = await fetch(`${PROD_ENDPOINT}/schedules/entries`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      scheduleId: scheduleId,
      entryId: entryId,
    }),
  });
  if (!response.ok) {
    throw new Error(`Failed to delete schedule entry with schedule ID ${scheduleId} and entry ID ${entryId}. Status: ${response.status}.`);
  }
}

