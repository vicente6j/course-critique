import { PROD_ENDPOINT } from "../endpoints";

export interface ScheduleEntryData {
  schedule_id: string;
  user_id: string;
  name: string;
  assigned_term: string | null;
  created_at: string | null;
  updated_at: string | null;
  course_id: string;
  grade: string | null;
  inserted_at: string | null;
}

export interface ScheduleInfo {
  schedule_id: string;
  user_id: string;
  name: string;
  assigned_term: string;
  created_at: string;
  updated_at: string;
}

export interface CourseScheduleResponse {
  all_user_schedules: ScheduleEntryData[];
}

export interface AllSchedulesResponse {
  all_schedules: ScheduleInfo[];
}

export const insertIntoSchedule = async (scheduleId: string, courseId: string): Promise<void> => {
  const response = await fetch(`${PROD_ENDPOINT}/schedules/courses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      scheduleId: scheduleId,
      courseId: courseId,
    }),
  });
  if (!response.ok) {
    throw new Error(`Failed to insert into ${scheduleId}.`);
  }
  return await response.json();
};

export const deleteFromSchedule = async (scheduleId: string, courseId: string): Promise<void> => {
  const response = await fetch(`${PROD_ENDPOINT}/schedules/courses`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      scheduleId: scheduleId,
      courseId: courseId,
    }),
  });
  if (!response.ok) {
    throw new Error(`Failed to delete from ${scheduleId}.`);
  }
  return await response.json();
};

const updateScheduleCourseID = async (newCourseId: string, scheduleId: string, oldCourseId: string): Promise<void> => {
  const response = await fetch(`${PROD_ENDPOINT}/schedules/courses`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      newCourseId: newCourseId,
      scheduleId: scheduleId,
      oldCourseId: oldCourseId,
    }),
  });
  if (!response.ok) {
    throw new Error(`Failed to update ${scheduleId} to have ${newCourseId}.`);
  }
  return await response.json();
};

const updateScheduleCourseGrade = async (grade: string, scheduleId: string, courseId: string): Promise<void> => {
  const response = await fetch(`${PROD_ENDPOINT}/schedules/courses`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      grade: grade,
      scheduleId: scheduleId,
      courseId: courseId,
    }),
  });
  if (!response.ok) {
    throw new Error(`Failed to update ${scheduleId} to have grade ${grade} on ${courseId}.`);
  }
  return await response.json();
};

const fetchRealCourseSchedule = async (userId: string): Promise<CourseScheduleResponse> => {
  const response = await fetch(`${PROD_ENDPOINT}/schedules/courses?userId=${encodeURIComponent(userId)}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'default'
  });
  if (!response.ok) {
    throw new Error('Failed to fetch course schedule data.');
  }
  return await response.json();
};

const fetchScheduleInfo = async (userId: string): Promise<AllSchedulesResponse> => {
  const response = await fetch(`${PROD_ENDPOINT}/schedules?userId=${encodeURIComponent(userId)}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'default'
  });
  if (!response.ok) {
    throw new Error('Failed to fetch schedule info data.');
  }
  return await response.json();
};

export const courseScheduleFetch = async (userId: string): Promise<ScheduleEntryData[]> => {

  let res: CourseScheduleResponse;
  try {
    res = await fetchRealCourseSchedule(userId);
  } catch (e) {
    throw new Error("Failed to fetch course schedule data.");
  }

  return res.all_user_schedules;
};

export const scheduleInfoFetch = async (userId: string): Promise<ScheduleInfo[]> => {

  let res: AllSchedulesResponse;
  try {
    res = await fetchScheduleInfo(userId);
  } catch (e) {
    throw new Error("Failed to fetch schedule info data.");
  }

  return res.all_schedules;
};