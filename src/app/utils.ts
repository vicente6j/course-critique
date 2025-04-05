import { DegreeProgram } from "./api/degree-programs";

/**
 * Simply converts a term into a sortable integer (in ascending order).
 * e.g. Fall 24 -> 20243, which is strictly greater than
 *      Summer 24 -> 20242
 * @param term 
 * @returns 
 */
export const termToSortableInteger: (term: string) => number = (term) => {
  const [semester, year] = term.split(' ');
  const yearNum = parseInt(year);
  const semesterNum = semester === 'Spring' ? 1 : semester === 'Summer' ? 2 : 3;
  return yearNum * 10 + semesterNum;
}

export const hexToRgba: (hex: string, opacity: number) => string = (hex, opacity) => {
  hex = hex.replace(/^#/, '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/**
 * GPA comes in the form of a sliding 0.0 - 4.0 scale,
 * and hence it doesn't make sense to use 'resolvedColors'
 * (we could also just Math.float() here but it probably doesn't
 * matter).
 * @param gpa sliding 0.0 to 4.0 scale double
 * @returns color
 */
export const getClientColorFromGPA: (gpa: number) => string = (gpa: number) => {
  let color: string = '#168921';
  if (gpa > 3.0 && gpa <= 3.5) {
    color = '#11AF22';
  } else if (gpa > 2.5 && gpa <= 3.0) {
    color = '#FCB400';
  } else if (gpa <= 2.5) {
    color = '#FE466C';
  }
  return color;
};

export const gradeDict: Record<string, number> = {
  'A': 4,
  'B': 3,
  'C': 2,
  'D': 1,
  'F': 0,
};

export const tailwindConversion: Record<string, string> = {
  'text-green-500': 'rgb(16,185,129)',
  'text-red-500': 'rgb(239,68,68)',
}

export const formatDate: (timestamp: string) => string = (timestamp: string) => {
  if (timestamp === '') {
    return '';
  }
  const date = new Date(timestamp);
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'full' }).format(date);
}

export const checkLevel: (program: DegreeProgram) => string = (program) => {
  return program.id.includes('-bs') ? 'Undergraduate' : 'Graduate';
}

export const possibleGrades: string[] = [
  'A', 'B', 'C', 'D', 'F', 'W'
];

export const gradeColorDictHex: Record<string, string> = {
  'A': '#168921',
  'B': '#11AF22',
  'C': '#FCB400',
  'D': '#FF9999',
  'F': '#FE466C',
  'W': '#666666',
};