'use client'
import { FC } from 'react';
import DegreePlanPageClient from './client';
import { Footer } from '../shared/footer';
import Navbar from '../navigation/navbar';
import { TermSelectionProvider } from '../hooks/termSelection/termSelectionContext';
import { ProfileContextProvider } from '../hooks/profile/profileContext';
import { SchedulesContextProvider } from '../hooks/schedules/schedulesContext';
import { ScheduleGradesContextProvider } from '../hooks/scheduleGrades/scheduleGradesContext';
import { ScheduleEntriesContextProvider } from '../hooks/scheduleEntries/scheduleEntriesContext';
import { ScheduleAssignmentsContextProvider } from '../hooks/scheduleAssignments/scheduleAssignmentsContext';
import { DegreePlanContextProvider } from '../hooks/degreePlan/degreePlanContext';

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
                    <DegreePlanContextProvider>
                      <DegreePlanPageClient />
                    </DegreePlanContextProvider>
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
