'use client'
import { FC, useCallback, useEffect, useState } from 'react';
import CourseClient from './client';
import courseFetch, { CompiledProf, CompiledResponse, CourseFetchAggregate, CourseHistory, CourseInfo, RelatedCourse } from './fetch';
import { Footer } from '../shared/footer';

export interface CoursePageProps {
  searchParams: { 
    courseID: string,
  };
}

const CoursePage: FC<CoursePageProps> = ({ 
  searchParams 
}: CoursePageProps) => {

  const [courseFetchAggregate, setCourseFetchAggregate] = useState<CourseFetchAggregate | null>(null); 
  const [fetchLoading, setFetchLoading] = useState<boolean>(false);
  const courseID = searchParams.courseID.split('/')[0];

  const fetchData: () => Promise<void> = useCallback(async () => {
    setFetchLoading(true);
    try {
      const courseFetchAggregate: CourseFetchAggregate = await courseFetch(courseID);
      setCourseFetchAggregate(courseFetchAggregate);
    } catch (error) {
      console.error('Error fetching course data:', error);
    }
    setFetchLoading(false);
  }, [searchParams.courseID]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-grow">
        <CourseClient 
          courseFetchAggregate={courseFetchAggregate!}
          fetchLoading={fetchLoading}
          courseID={searchParams.courseID!}
        />
      </div>
      <Footer />
    </div>
  );
};

export default CoursePage;
