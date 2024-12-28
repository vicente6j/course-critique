'use client'
import { FC } from 'react';
import DegreePlanPageClient from './client';
import { Footer } from '../shared/footer';
import Navbar from '../shared/navbar';
import { TermSelectionProvider } from '../client-contexts/termSelectionContext';
import { DegreePlanContextProvider } from '../client-contexts/degreePlanContext';

export interface DegreePlanPageProps {}

const DegreePlanPage: FC<DegreePlanPageProps> = ({ 
   
}: DegreePlanPageProps) => {

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-grow">
        <DegreePlanContextProvider>
          <TermSelectionProvider>
            <DegreePlanPageClient />
          </TermSelectionProvider>
        </DegreePlanContextProvider>
      </div>
      <Footer />
    </div>
  );
};

export default DegreePlanPage;
