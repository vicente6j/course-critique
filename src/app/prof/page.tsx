'use client'
import { FC, useCallback, useEffect, useState } from 'react';
import profFetch, { CompiledCourse, CompiledProfResponse, ProfHistory, RelatedProf } from './fetch';
import { CompiledProf } from '../course/fetch';
import { Prof, ProfProvider } from '../server-contexts/prof';
import { AllProfProvider } from '../server-contexts/allProf';
import ProfClient from './client';
import { Footer } from '../shared/footer';

export interface CoursePageProps {
  searchParams: { 
    profID: string;
  };
}

const CoursePage: FC<CoursePageProps> = ({ 
  searchParams 
}: CoursePageProps) => {

  const [compiledCourses, setCompiledCourses] = useState<CompiledCourse[]>([]);
  const [compiledProfResponse, setCompiledProfResponse] = useState<CompiledProfResponse | null>(null);
  const [profInfo, setProfInfo] = useState<Prof | null>(null);
  const [loading, setLoading] = useState(true);
  const [profHistory, setProfHistory] = useState<ProfHistory | null>(null);
  const [relatedProfs, setRelatedProfs] = useState<RelatedProf[] | null>(null);

  const fetchData: () => Promise<void> = useCallback(async () => {
    setLoading(true);
    try {
      const { compiledCourses, compiledProfResponse, info, related_profs, profHistory } = await profFetch(searchParams.profID);
      setCompiledCourses(compiledCourses);
      setCompiledProfResponse(compiledProfResponse);
      setProfInfo(info);
      setProfHistory(profHistory);
      setRelatedProfs(related_profs);
    } catch (error) {
      console.error('Error fetching prof data:', error);
    } finally {
      setLoading(false);
    }
  }, [searchParams.profID]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-grow">
        <ProfProvider>
          <AllProfProvider>
            <ProfClient 
              compiledProfResponse={compiledProfResponse} 
              compiledCourses={compiledCourses} 
              profInfo={profInfo}
              loading={loading}
              profHistory={profHistory}
              relatedProfs={relatedProfs}
            />
          </AllProfProvider>
        </ProfProvider>
      </div>
      <Footer />
    </div>
  );
};

export default CoursePage;
