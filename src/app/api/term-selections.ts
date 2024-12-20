'use server'

import { PROD_ENDPOINT } from "../endpoints";

export interface TermSelection {
  term: string;
  userId: string;
  selected_at: string | null;
}

export const createTermSelection = async (
  term: string, 
  userId: string,
): Promise<void> => {
  const response = await fetch(`${PROD_ENDPOINT}/term-selections`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      action: 'insert',
      term: term,
      userId: userId,
    }),
  });
  if (!response.ok) {
    throw new Error(
      `Failed to insert term selection for term ${term} and user with ID ${userId}. Status: ${response.status}.`
    );
  }
}

export const fetchTermSelections = async (userId: string): Promise<TermSelection[]> => {
  const response = await fetch(`${PROD_ENDPOINT}/term-selections`, {
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
    throw new Error(`Failed to fetch term selections for user with ID ${userId}. Status: ${response.status}.`);
  }
  return response.json();
}

export const deleteTermSelection = async (term: string, userId: string): Promise<void> => {
  const response = await fetch(`${PROD_ENDPOINT}/term-selections`, {
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
    throw new Error(`Failed to term selection for user with ID ${userId} (term: ${term}). Status: ${response.status}.`);
  }
}

