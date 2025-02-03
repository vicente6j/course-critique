export const PROD_DATA_ENDPOINT = 'https://c4citk6s9k.execute-api.us-east-1.amazonaws.com/prod/data';
export const PROD_ENDPOINT = 'https://c4citk6s9k.execute-api.us-east-1.amazonaws.com/prod';

/** Courses */
export const COURSE_INFO_JSON = `${process.env.BASE_URL}/data/course/course_info.json`;
export const COURSE_AVERAGES_JSON = `${process.env.BASE_URL}/data/course/course_averages.json`;
export const COURSE_AVERAGES_BY_TERM_JSON = `${process.env.BASE_URL}/data/course/course_averages_by_term.json`;
export const PROF_AVERAGES_BY_COURSE = `${process.env.BASE_URL}/data/course/prof_averages_by_course.json`;

/** Profs */
export const PROF_INFO_JSON = `${process.env.BASE_URL}/data/prof/prof_info.json`;
export const PROF_AVERAGES_JSON = `${process.env.BASE_URL}/data/prof/prof_averages.json`;
export const PROF_AVERAGES_BY_TERM_JSON = `${process.env.BASE_URL}/data/prof/prof_averages_by_term.json`;
export const COURSE_AVERAGES_BY_PROF_JSON = `${process.env.BASE_URL}/data/prof/course_averages_by_prof.json`;
export const COURSES_TAUGHT_BY_TERM_JSON = `${process.env.BASE_URL}/data/prof/courses_taught_by_term.json`;

/** Degree requirements */
export const ALL_DEGREE_PROGRAMS_JSON = `${process.env.BASE_URL}/data/majors/degree_programs.json`;
export const ALL_DEGREE_REQUIREMENTS_JSON = `${process.env.BASE_URL}/data/majors/degree_requirements.json`;

/**
 * Mock data accumulates to around 4.1 MB of data (see ../../data/README.md), 
 * which is small enough to hopefully significantly improve our init bundle size and rebuild times for development. 
 * For perspective, the production bundle size comes
 * out to around 13MB for just course data alone, and is likely over 30MB for everything.
 */
export const MOCK_COURSE_AVERAGES_JSON = `${process.env.BASE_URL}/data/mock/cs_course_averages.json`;
export const MOCK_COURSE_AVERAGES_BY_TERM_JSON = `${process.env.BASE_URL}/data/mock/course_averages_by_term.json`;
export const MOCK_PROF_AVERAGES_BY_COURSE_JSON = `${process.env.BASE_URL}/data/mock/prof_averages_by_course.json`;

export const MOCK_DEGREE_PROGRAMS_JSON = `${process.env.BASE_URL}/data/mock/cs_degree_programs.json`;

export const MOCK_PROF_AVERAGES_JSON = `${process.env.BASE_URL}/data/mock/prof_averages.json`;
export const MOCK_PROF_AVERAGES_BY_TERM_JSON = `${process.env.BASE_URL}/data/mock/prof_averages_by_term.json`;
export const MOCK_COURSE_AVERAGES_BY_PROF_JSON = `${process.env.BASE_URL}/data/mock/course_averages_by_prof.json`;
export const MOCK_COURSES_TAUGHT_BY_TERM_JSON = `${process.env.BASE_URL}/data/mock/courses_taught_by_term.json`;