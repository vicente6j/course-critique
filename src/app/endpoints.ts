export const PROD_DATA_ENDPOINT = 'https://c4citk6s9k.execute-api.us-east-1.amazonaws.com/prod/data';
export const PROD_ENDPOINT = 'https://c4citk6s9k.execute-api.us-east-1.amazonaws.com/prod';

export const COURSE_INFO_JSON = `${process.env.BASE_URL}/json/course/course_info.json`;
export const PROF_INFO_JSON = `${process.env.BASE_URL}/json/prof/prof_info.json`;

/** Course averages */
export const ALL_COURSE_AVERAGES_JSON = `${process.env.BASE_URL}/json/course/course_averages.json`;
export const ALL_COURSE_AVERAGES_BY_PROF_JSON = `${process.env.BASE_URL}/json/course/course_averages_by_prof.json`;
export const ALL_COURSE_AVERAGES_BY_TERM_JSON = `${process.env.BASE_URL}/json/course/course_averages_by_term.json`;

/** Prof averages */
export const ALL_PROF_AVERAGES_JSON = `${process.env.BASE_URL}/json/prof/prof_averages.json`;
export const ALL_PROF_AVERAGES_BY_TERM_JSON = `${process.env.BASE_URL}/json/prof/prof_averages_by_term.json`;
export const ALL_PROF_AVERAGES_BY_COURSE_JSON = `${process.env.BASE_URL}/json/prof/prof_averages_by_course.json`;
export const HOT_COURSES_JSON = `${process.env.BASE_URL}/json/prof/prof_hot_courses.json`;

/** Degree requirements */
export const ALL_DEGREE_PROGRAMS_JSON = `${process.env.BASE_URL}/json/majors/degree_programs.json`;
export const ALL_DEGREE_REQUIREMENTS_JSON = `${process.env.BASE_URL}/json/majors/degree_requirements.json`;

/**
 * Mock data accumulates to around 1.7MB of data, which is small enough to hopefully significantly improve
 * our init bundle size and rebuild times for development. For perspective, the production bundle size comes
 * out to around 13MB for just course data alone, and is likely over 30MB for everything.
 */
export const MOCK_COURSE_AVERAGES_JSON = `${process.env.BASE_URL}/json/mock-data/cs_course_averages.json`;
export const MOCK_COURSE_AVERAGES_BY_PROF_JSON = `${process.env.BASE_URL}/json/mock-data/cs_course_averages_by_prof.json`;
export const MOCK_COURSE_AVERAGES_BY_TERM_JSON = `${process.env.BASE_URL}/json/mock-data/cs_course_averages_by_term.json`;
export const MOCK_COURSE_INFO_JSON = `${process.env.BASE_URL}/json/mock-data/cs_course_info.json`;
export const MOCK_DEGREE_PROGRAMS_JSON = `${process.env.BASE_URL}/json/mock-data/cs_degree_programs.json`;
export const MOCK_PROF_AVERAGES_JSON = `${process.env.BASE_URL}/json/mock-data/cs_prof_averages.json`;
export const MOCK_PROF_INFO_JSON = `${process.env.BASE_URL}/json/mock-data/cs_prof_info.json`;