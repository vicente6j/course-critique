'use client'
import Navbar from '@/app/navigation/navbar';
import { FC, useCallback, useEffect, useState } from 'react';
import { Footer } from '@/app/shared/footer';
import RankingsPageProfClient from './client';
export interface RankingsPageProps {}

const CourseRankingsPage: FC<RankingsPageProps> = ({ 
   
}: RankingsPageProps) => {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-grow">
        <Navbar />
        <div className="w-full">
          <RankingsPageProfClient />
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CourseRankingsPage;
