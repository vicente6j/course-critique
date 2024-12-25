export interface MetadataType {
  year: number;
  is_spring: boolean;
}

export const Metadata: MetadataType = {
  year: 2024,
  is_spring: false,
};

export const ALL_TERMS: string[] = [
  'Fall 2020', 'Spring 2021', 'Summer 2021',
  'Fall 2021', 'Spring 2022', 'Summer 2022',
  'Fall 2022', 'Spring 2023', 'Summer 2023',
  'Fall 2023', 'Spring 2024', 'Summer 2024',
  'Fall 2024', 'Spring 2025', 'Summer 2025',
  'Fall 2025', 'Spring 2026', 'Summer 2026',
  'Fall 2026', 'Spring 2027', 'Summer 2027',
  'Fall 2027', 'Spring 2028', 'Summer 2028',
  'Fall 2028', 'Spring 2029', 'Summer 2029',
  'Fall 2029', 'Spring 2030',
];

export const GRADE_COLORS: string[] = [
  '#168921', 
  '#11AF22',
  '#FCB400',
  '#FF9999',
  '#FE466C',
  '#9CC7FF',
  '#2D7FF9',
]