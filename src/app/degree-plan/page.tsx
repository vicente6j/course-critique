'use client'
import { FC } from 'react';
import DegreePlanPageClient from './client';
import { Footer } from '../shared/footer';
import Navbar from '../navigation/navbar';
import { TermSelectionProvider } from '../contexts/client/termSelectionContext';
import { ProfileContextProvider } from '../contexts/client/profile';
import { SchedulesContextProvider } from '../contexts/client/schedulesContext';
import { ScheduleGradesContextProvider } from '../contexts/client/scheduleGradesContext';
import { ScheduleEntriesContextProvider } from '../contexts/client/scheduleEntriesContext';
import { ScheduleAssignmentsContextProvider } from '../contexts/client/scheduleAssignmentsContext';

export interface DegreePlanPageProps {}

const DegreePlanPage: FC<DegreePlanPageProps> = ({ 
   
}: DegreePlanPageProps) => {

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-grow">
        <TermSelectionProvider>
          <ProfileContextProvider>
            <SchedulesContextProvider>
              <ScheduleGradesContextProvider>
                <ScheduleEntriesContextProvider>
                  <ScheduleAssignmentsContextProvider>
                    <DegreePlanPageClient />
                  </ScheduleAssignmentsContextProvider>
                </ScheduleEntriesContextProvider>
              </ScheduleGradesContextProvider>
            </SchedulesContextProvider>
          </ProfileContextProvider>
        </TermSelectionProvider>
      </div>
      <Footer />
    </div>
  );
};

export default DegreePlanPage;
