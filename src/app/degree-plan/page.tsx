'use client'
import { FC } from 'react';
import DegreePlanPageClient from './client';
import { Footer } from '../shared/footer';
import Navbar from '../navigation/navbar';
import { TermSelectionProvider } from '../contexts/client/termSelectionContext';
import { ProfileContextProvider } from '../contexts/client/profile';
import { useDatabaseProfile } from '../contexts/server/profile/provider';
import { SchedulesContextProvider } from '../contexts/client/schedulesContext';

export interface DegreePlanPageProps {}

const DegreePlanPage: FC<DegreePlanPageProps> = ({ 
   
}: DegreePlanPageProps) => {

  const {
    data
  } = useDatabaseProfile();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-grow">
        <TermSelectionProvider initialTerms={data.termSelections}>
          <ProfileContextProvider>
            <SchedulesContextProvider>
              <DegreePlanPageClient />
            </SchedulesContextProvider>
          </ProfileContextProvider>
        </TermSelectionProvider>
      </div>
      <Footer />
    </div>
  );
};

export default DegreePlanPage;
