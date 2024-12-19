'use server'

import { PROD_ENDPOINT } from "../endpoints";

export interface ScheduleAssignment {
  term: string;
  userId: string;
  scheduleId: string;
  assigned_at: string | null;
}

export const createScheduleAssignment = async (
  scheduleId: string, 
  term: string, 
  userId: string
): Promise<void> => {
  const response = await fetch(`${PROD_ENDPOINT}/schedules/assignments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      action: 'create',
      scheduleId: scheduleId,
      term: term,
      userId: userId,
    }),
  });
  if (!response.ok) {
    throw new Error(
      `Failed to create schedule assignment on term ${term} for schedule with ID ${scheduleId} and user with ID ${userId}.
      Status: ${response.status}.`
    );
  }
}

export const fetchAssignments = async (userId: string): Promise<ScheduleAssignment[]> => {
  const response = await fetch(`${PROD_ENDPOINT}/schedules/assignments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      userId: userId,
      action: 'list'
    }),
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch schedule assignments for user with ID ${userId}. Status: ${response.status}.`);
  }
  return response.json();
}

export const updateScheduleAssignment = async (term: string, scheduleId: string, userId: string): Promise<void> => {
  const response = await fetch(`${PROD_ENDPOINT}/schedules/assignments`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      scheduleId: scheduleId,
      term: term,
      userId: userId
    }),
  });
  if (!response.ok) {
    throw new Error(
      `Failed to update schedule assignment with schedule ID ${scheduleId}, user ID ${userId}, and term ${term}. Status: ${response.status}.`
    );
  }
}

export const deleteScheduleAssignment = async (term: string, userId: string): Promise<void> => {
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
    throw new Error(`Failed to delete schedule assignment for term ${term} and user ID ${userId}. Status: ${response.status}.`);
  }
}

