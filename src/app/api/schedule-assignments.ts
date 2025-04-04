'use server'

import { PROD_ENDPOINT } from "../endpoints";

export interface ScheduleAssignment {
  term: string;
  schedule_id: string;
  assigned_at: string | null;
}

export const createScheduleAssignment = async (
  userId: string,
  scheduleId: string, 
  term: string,
): Promise<void> => {
  const response = await fetch(`${PROD_ENDPOINT}/schedules/assignments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      action: 'create',
      userId: userId,
      scheduleId: scheduleId,
      term: term,
    }),
  });
  if (!response.ok) {
    throw new Error(
      `Failed to create schedule assignment for ${userId} on term ${term} for schedule with ID ${scheduleId}.
      Status: ${response.status}.`
    );
  }
}

export const fetchScheduleAssignments = async (
  userId: string
): Promise<ScheduleAssignment[]> => {
  const response = await fetch(`${PROD_ENDPOINT}/schedules/assignments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      userId: userId,
      action: 'list'
    }),
    cache: 'no-store'  // Explicitly tell Next.js to never cache this
  });
  if (!response.ok) {
    throw new Error(
      `Failed to fetch schedule assignments for user with ID ${userId}.
      Status: ${response.status}.`
    );
  }
  return response.json();
}

export const updateScheduleAssignment = async (
  userId: string,
  term: string,
  newScheduleId: string
): Promise<void> => {
  const response = await fetch(`${PROD_ENDPOINT}/schedules/assignments`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      term: term,
      userId: userId,
      newScheduleId: newScheduleId,
    }),
  });
  if (!response.ok) {
    throw new Error(
      `Failed to update schedule assignment on term ${term} for user with ID ${userId} to ${newScheduleId}.
      Status: ${response.status}.`
    );
  }
}


export const deleteScheduleAssignment = async (
  userId: string,
  term: string
): Promise<void> => {
  const response = await fetch(`${PROD_ENDPOINT}/schedules/assignments`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      term: term,
      userId: userId,
    }),
  });
  if (!response.ok) {
    throw new Error(
      `Failed to delete schedule assignment on term ${term} for user with ID ${userId}.
      Status: ${response.status}.`
    );
  }
}

