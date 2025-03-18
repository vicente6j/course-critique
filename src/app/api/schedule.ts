'use server'

import { PROD_ENDPOINT } from "../endpoints";

export interface ScheduleInfo {
  schedule_id: string;
  user_id: string;
  name: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export type ActionType = 'list' | 'create';

export const createSchedule = async (
  userId: string, 
  scheduleName?: string
): Promise<void> => {

  /**
   * If there isn't a schedule name, don't put the field down.
   */
  const body: {
    userId: string;
    action: string;
    scheduleName?: string;
  } = {
    userId: userId,
    action: 'create',
  };

  if (scheduleName !== undefined) {
    body.scheduleName = scheduleName;
  }

  const response = await fetch(`${PROD_ENDPOINT}/schedules`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`Failed to create a schedule for user with ID ${userId}. Status: ${response.status}.`);
  }
}

export const fetchSchedules = async (
  userId: string
): Promise<ScheduleInfo[]> => {
  const response = await fetch(`${PROD_ENDPOINT}/schedules`, {
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
    throw new Error(`Failed to get schedules for user with ID ${userId}. Status: ${response.status}.`);
  }
  return response.json();
}

/**
 * Importantly for the time being the only field which we can update in a 
 * schedule is the schedule name.
 * @param scheduleId The ID of the schedule to be updated.
 * @param scheduleName The new name for the schedule.
 */
export const updateSchedule = async (
  scheduleId: string, 
  scheduleName: string
): Promise<void> => {
  const response = await fetch(`${PROD_ENDPOINT}/schedules`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      scheduleId: scheduleId,
      scheduleName: scheduleName,
    }),
  });
  if (!response.ok) {
    throw new Error(`Failed to update schedule with ID ${scheduleId}. Status: ${response.status}.`);
  }
}

export const deleteSchedule = async (
  scheduleId: string
): Promise<void> => {
  const response = await fetch(`${PROD_ENDPOINT}/schedules`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      scheduleId: scheduleId,
    }),
  });
  if (!response.ok) {
    throw new Error(`Failed to delete schedule with ID ${scheduleId}. Status: ${response.status}.`);
  }
}

