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

export const ALL_DEGREE_PROGRAMS_JSON = `${process.env.BASE_URL}/json/majors/degree_programs.json`;
export const ALL_DEGREE_REQUIREMENTS_JSON = `${process.env.BASE_URL}/json/majors/degree_requirements.json`;