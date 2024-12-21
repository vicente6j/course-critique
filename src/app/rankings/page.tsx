'use client'
import { FC, useCallback, useEffect, useState } from 'react';
import RankingsPageClient from './client';
import { Footer } from '../shared/footer';
import Navbar from '../shared/navbar';

export interface RankingsPageProps {}

const RankingsPage: FC<RankingsPageProps> = ({ 
   
}: RankingsPageProps) => {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-grow">
        <Navbar />
        <div className="w-full">
          <RankingsPageClient />
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default RankingsPage;
