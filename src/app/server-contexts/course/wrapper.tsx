'use server'

import { FC } from "react"
import CourseProvider from "./provider";
import { CourseAverages, CourseAveragesByTerm, CourseInfo, fetchCourseAverages, fetchCourseAveragesByTerm, fetchCourseInfo, fetchProfAveragesByCourse, ProfAveragesByCourse } from "@/app/api/course";

export interface CourseProviderWrapperProps {
  children: React.ReactNode;
}

const CourseProviderWrapper: FC<CourseProviderWrapperProps> = async ({
  children
}: CourseProviderWrapperProps) => {

  const courseAverages: CourseAverages[] = await fetchCourseAverages();
  const profAveragesByCourse: ProfAveragesByCourse[] = await fetchProfAveragesByCourse();
  const courseAveragesByTerm: CourseAveragesByTerm[] = await fetchCourseAveragesByTerm();
  const courseInfo: CourseInfo[] = await fetchCourseInfo();

  return (
    <CourseProvider
      courseAverages={courseAverages}
      profAveragesByCourse={profAveragesByCourse}
      courseAveragesByTerm={courseAveragesByTerm}
      courses={courseInfo}
    >
      {children}
    </CourseProvider>
  );
}

export default CourseProviderWrapper;