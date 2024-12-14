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
const fetchProfile = async (email: string): Promise<ProfileResponse[]> => {
  const response = await fetch(`${PROD_ENDPOINT}/user`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: email,
    }),
    cache: 'default'
  });
  if (!response.ok) {
    throw new Error('Failed to fetch profile data');
  }
  return await response.json();
};

/**
 * Modifier to update fields for a given user.
 * @param field field to modify (one of 'level', 'year', 'degree_program', 'secondary_degree_program', 'minor_program')
 * @param value new value
 * @param id id of user
 * @returns 
 */
export const updateField = async (field: string, value: number | string, id: string): Promise<void> => {
  const response = await fetch(`${PROD_ENDPOINT}/user`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id: id,
      [field]: value,
    }),
  });
  if (!response.ok) {
    throw new Error('Failed to put new year.');
  }

  return await response.json();
};

/**
 * We're again using in-memory caching for this profile data. But it's likely not super
 * necessary, any caching mechanism can work here.
 * 
 * UPDATE: removing caching because this might be throwing errors.
 */
const profileFetch = async (email: string): Promise<ProfileResponse> => {

  let profile: ProfileResponse[];
  try {
    profile = await fetchProfile(email);
  } catch (e) {
    throw new Error("Failed to fetch profile data.");
  }

  return profile[0];
};

export default profileFetch;
