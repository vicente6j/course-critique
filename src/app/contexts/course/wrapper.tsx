'use server'

import { FC } from "react"
import CourseProvider from "./provider";
import { CourseAverages, CourseAveragesByProf, CourseAveragesByTerm, CourseInfo, fetchCourseAverages, fetchCourseAveragesByProf, fetchCourseAveragesByTerm, fetchCourseInfo } from "@/app/api/course";


export interface CourseProviderWrapperProps {
  children: React.ReactNode;
}

const CourseProviderWrapper: FC<CourseProviderWrapperProps> = async ({
  children
}: CourseProviderWrapperProps) => {

  const courseAveragesPure: CourseAverages[] = await fetchCourseAverages();
  const courseAveragesByProf: CourseAveragesByProf[] = await fetchCourseAveragesByProf();
  const courseAveragesByTerm: CourseAveragesByTerm[] = await fetchCourseAveragesByTerm();
  const courseInfo: CourseInfo[] = await fetchCourseInfo();

  return (
    <CourseProvider
      courseAveragesPure={courseAveragesPure}
      courseAveragesByProf={courseAveragesByProf}
      courseAveragesByTerm={courseAveragesByTerm}
      courseInfo={courseInfo}
    >
      {children}
    </CourseProvider>
  );
}

export default CourseProviderWrapper;