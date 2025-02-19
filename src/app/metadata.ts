export interface MetadataType {
  global: GlobalType;
}

export interface GlobalType {
  year: number | string;
  is_spring: boolean;
  most_recent_term: string;
}

export const metadata: MetadataType = {
  global: {
    year: 2025,
    is_spring: true,
    most_recent_term: 'Fall 2024',
  },
};

export const dataTerms: string[] = [
  'Summer 2010', 'Fall 2010', 'Spring 2011', 
  'Summer 2011', 'Fall 2011', 'Spring 2012', 
  'Summer 2012', 'Fall 2012', 'Spring 2013', 
  'Summer 2013', 'Fall 2013', 'Spring 2014', 
  'Summer 2014', 'Fall 2014', 'Spring 2015', 
  'Summer 2015', 'Fall 2015', 'Spring 2016', 
  'Summer 2016', 'Fall 2016', 'Spring 2017', 
  'Summer 2017', 'Fall 2017', 'Spring 2018', 
  'Summer 2018', 'Fall 2018', 'Spring 2019', 
  'Summer 2019', 'Fall 2019', 'Spring 2020', 
  'Summer 2020', 'Fall 2020', 'Spring 2021', 
  'Summer 2021', 'Fall 2021', 'Spring 2022', 
  'Summer 2022', 'Fall 2022', 'Spring 2023', 
  'Summer 2023', 'Fall 2023', 'Spring 2024', 
  'Summer 2024', 'Fall 2024',
];

export const scheduleTerms: string[] = [
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
];

export const POSSIBLE_GRADES: string[] = [
  'A', 'B', 'C', 'D', 'F', 'W'
];