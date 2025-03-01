'use server'

import { PROD_ENDPOINT } from "../endpoints";

/**
 * When we fetch profile data, this data is unlikely to update frequently following its initialization,
 * but to accomodate the needs of removing stale data we also won't incorporate caching here
 * (either in-memory or on the server).
 */
export interface ProfileResponse {
  id: string;
  name: string;
  email: string;
  provider: string;
  level: string | null;
  year: number | null;
  degree_program: string | null;
  secondary_degree_program: string | null;
  minor_program: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Fetches the user data from the users table. Importantly, we do this via email (not ID)
 * since the email is the only attribute we're given by Google auth upon sign in (plus the
 * name, but that's not queryable). Hence emails are likewise unique, similar to ids.
 * @param email email to query for
 * @returns the full user profile from users.
 */
export const fetchProfile = async (email: string): Promise<ProfileResponse> => {
  const response = await fetch(`${PROD_ENDPOINT}/user`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: email,
    }),
    cache: 'no-store'
  });
  if (!response.ok) {
    throw new Error('Failed to fetch profile data');
  }
  return await response.json();
};

export type ProfileField = 
| 'level' 
| 'year' 
| 'degree_program' 
| 'secondary_degree_program' 
| 'minor_program';

type FieldValue = string | number | null;

/**
 * Modifier to update fields for a given user.
 * @param field field to modify 
 *  (one of 'level', 'year', 'degree_program', 'secondary_degree_program', 'minor_program')
 * @param value New value for the field
 * @param userId ID of the user to update
 * @throws Error if the update request fails
 */
export const updateProfileField = async (
  field: ProfileField, 
  value: FieldValue, 
  userId: string
): Promise<void> => {
  const response = await fetch(`${PROD_ENDPOINT}/user`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId: userId,
      [field]: value,
    }),
  });
  if (!response.ok) {
    throw new Error(
      `Failed to update ${field}. Status: ${response.status} ${response.statusText}`
    );
  }
  return;
};
