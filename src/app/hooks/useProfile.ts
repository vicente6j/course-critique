import { useCallback, useEffect, useState } from "react";
import { useDegreePrograms } from "../contexts/server/degree-programs/provider";
import { useDatabaseProfile } from "../contexts/server/profile/provider";
import { checkLevel } from "../utils";
import { updateProfileField } from "../api/profile";

export interface ExposedProfileData {
  year: number | null;
  degreeProgram: string | null;
  secondaryDegreeProgram: string | null;
  minorProgram: string | null;
  level: string | null;
  createdAt: string | null;
};

export interface ExposedProfileHandlers {
  handleYearChange: (year: number | null) => Promise<void>;
  handleDegreeProgramChange: (programId: string | null) => Promise<void>;
  handleSecondaryDegreeProgramChange: (programId: string | null) => Promise<void>;
  handleMinorProgramChange: (programId: string | null) => Promise<void>;
}

export interface UseUserProfileValue {
  data: ExposedProfileData;
  handlers: ExposedProfileHandlers;
}

export const useUserProfile = (): UseUserProfileValue => {

  const [year, setYear] = useState<number | null>(null);
  const [degreeProgram, setDegreeProgram] = useState<string | null>(null);
  const [secondaryDegreeProgram, setSecondaryDegreeProgram] = useState<string | null>(null);
  const [minorProgram, setMinorProgram] = useState<string | null>(null);
  const [level, setLevel] = useState<string | null>('Not specified');
  const [createdAt, setCreatedAt] = useState<string | null>(null);

  const { 
    data: data,
    revalidate
  } = useDatabaseProfile();

  const { 
    maps: programMaps,
  } = useDegreePrograms();

  const fetchFromProfile: () => void = useCallback(async () => {
    if (!data || !data.profile || !programMaps.degreePrograms) {
      return;
    }
    const year = data.profile.year;
    if (year) {
      setYear(year);
    }
    const degree = data.profile.degree_program;
    if (degree && programMaps.degreePrograms.has(degree)) {
      setDegreeProgram(degree);
      const level = checkLevel(programMaps.degreePrograms.get(degree)!)
      setLevel(level);
    }
    const secondaryDegree = data.profile.secondary_degree_program;
    if (secondaryDegree && programMaps.degreePrograms.has(secondaryDegree)) {
      setSecondaryDegreeProgram(secondaryDegree);
    }
    const minor = data.profile.minor_program;
    if (minor && programMaps.degreePrograms.has(minor)) {
      setMinorProgram(minor);
    }
    const createdAt = data.profile.created_at;
    setCreatedAt(createdAt);
  }, [data, programMaps.degreePrograms]);

  useEffect(() => {
    fetchFromProfile();
  }, [fetchFromProfile]);

  const handleYearChange: (year: number | null) => Promise<void> = useCallback(async (year) => {
    setYear(year);
    await updateProfileField('year', year, data.profile!.id);
    await revalidate.refetchProfile();
    /** 
     * Since the user's year is changing, we also have logic to update term selctions in
     * /prod/user --> updateUser.
     */
    await revalidate.refetchTermSelections();
  }, [data.profile!.id]);

  /**
   * Supports updating the degree program as well as the level of the user
   * (i.e. undergraduate or graduate).
   */
  const handleDegreeProgramChange: (programId: string | null) => Promise<void> = useCallback(async (programId) => {
    setDegreeProgram(programId);
    await updateProfileField('degree_program', programId, data.profile!.id);
    await revalidate.refetchProfile();
    
    if (programId) {
      const level = checkLevel(programMaps.degreePrograms?.get(programId)!);
      setLevel(level); 
    } else {
      setLevel(null);
    }
  }, [data.profile!.id, programMaps.degreePrograms]);

  const handleSecondaryDegreeProgramChange: (programId: string | null) => Promise<void> = useCallback(async (programId) => {
    setSecondaryDegreeProgram(programId);
    await updateProfileField('secondary_degree_program', programId, data.profile!.id);
    await revalidate.refetchProfile();
  }, [data.profile!.id]);

  const handleMinorProgramChange: (programId: string | null) => Promise<void> = useCallback(async (programId) => {
    setMinorProgram(programId);
    await updateProfileField('minor_program', programId, data.profile!.id);
    await revalidate.refetchProfile();
  }, [data.profile?.id]);

  return {
    data: {
      year,
      degreeProgram,
      secondaryDegreeProgram,
      minorProgram,
      level,
      createdAt
    },
    handlers: {
      handleYearChange,
      handleDegreeProgramChange,
      handleSecondaryDegreeProgramChange,
      handleMinorProgramChange
    }
  };
}