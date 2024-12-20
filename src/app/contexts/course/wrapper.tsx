'use server'

import { FC } from "react"
import CourseProvider from "./provider";
import { CourseAverages, CourseAveragesByProf, CourseAveragesByTerm, CourseInfo, fetchCourseData, fetchCourseInfo } from "@/app/api/course";


export interface CourseProviderWrapperProps {
  children: React.ReactNode;
}

const CourseProviderWrapper: FC<CourseProviderWrapperProps> = async ({
  children
}: CourseProviderWrapperProps) => {

  const courseAverages: CourseAverages[] = await fetchCourseData('averages');
  const courseAveragesByProf: CourseAveragesByProf[] = await fetchCourseData('byProf');
  const courseAveragesByTerm: CourseAveragesByTerm[] = await fetchCourseData('byTerm');
  const courses: CourseInfo[] = await fetchCourseInfo();

  return (
    <CourseProvider
      courseAverages={courseAverages}
      courseAveragesByProf={courseAveragesByProf}
      courseAveragesByTerm={courseAveragesByTerm}
      courses={courses}
    >
      {children}
    </CourseProvider>
  );
}

export default CourseProviderWrapper;