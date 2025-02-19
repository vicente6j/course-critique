Use ./course/course_info.json for mock data purposes, same for ./prof/prof_info. The rest of the mock data is contained within
./mock.

Note that every term, all of the following should be updated with new values:
1. ./course/course_info.json.
2. ./course/course_averages_by_term.json.
3. ./course/courseAverages.json.
4. ./course/prof_averages_by_course.
since a single term's data can influence all aggregate averages for instructors and courses. Course info should
get updated via the scraper which cheks to see if there are any new entries listed inside https://catalog.gatech.edu/coursesaz/.

Additionally,
5. ./prof/course_averages_by_prof.json.
6. ./prof/courses_taught_by_term.json (just add another term).
7. ./prof/prof_averages_by_term.json.
8. ./prof/prof_averages.json.
9. ./prof/prof_info.json.
should all get updated as well. Updating prof info requires manually inserting entries from the new term data
dataframe into the instructors table, and assigning GT IDs where necessary.

Lastly, every file inside /mock should get updated as well.
To-do: figure out a way to automate/semi-automate this process.

ROUGH SIZE ESIMATES:
1. Within /mock:

Courses:
course_averages_by_term.json -- 964 KB
course_averages.json -- 63 KB
prof_averages_by_course.json -- 552 KB
course_info.json -- 142 KB
= 1.721 MB

Profs:
course_averages_by_prof.json -- 552 KB
courses_taught_by_term.json -- 678 KB
prof_averages_by_term.json -- 1.2 MB
prof_averages.json -- 110 KB
prof_info -- 105 KB
= 2.645 MB

for a combined 4.366 MB of average data.


