'use client'
import { FC, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { signOut } from "next-auth/react";
import { Button, SharedSelection, Spinner } from "@nextui-org/react";
import LogoutIcon from '@mui/icons-material/Logout';
import { Input } from "@nextui-org/input";
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { SearchIcon } from "../../../public/icons/searchIcon";
import { Tooltip as NextToolTip } from "@nextui-org/tooltip";
import InfoIcon from '@mui/icons-material/Info';
import { useDegreePrograms } from "../contexts/server/degree-programs/provider";
import { DegreeProgram } from "../api/degree-programs";
import { updateProfileField } from "../api/profile";
import { Skeleton } from "@nextui-org/skeleton";
import { DegreeProgramType } from "../globalTypes";
import { checkLevel, formatDate } from "../utils";
import SelectionDropdown, { SelectionOption } from "../shared/selectionDropdown";
import { useDatabaseProfile } from "../contexts/server/profile/provider";
import { useProfileContext } from "../contexts/client/profile";

export const suffixDict: Record<number, string> = {
  1: '1st',
  2: '2nd',
  3: '3rd',
  4: '4th'
};

export interface DropdownMenuItem {
  key: string;
  label: string;
}

export interface ProfilePageClientProps {}

const ProfilePageClient: FC<ProfilePageClientProps> = ({

}: ProfilePageClientProps) => {

  const {
    data: programData,
    maps: programMaps,
    loading: degreesLoading
  } = useDegreePrograms();

  const {
    data: databaseData
  } = useDatabaseProfile();

  const {
    data,
    handlers
  } = useProfileContext();
  
  const nonMinorItems: DegreeProgram[] = useMemo(() => {
    if (!programData.degreePrograms) {
      return [];
    }
    return programData.degreePrograms.filter(degreeProgram => (
      !degreeProgram.id.includes('minor')
    ));
  }, [programData.degreePrograms]);

  const minorItems: DegreeProgram[] = useMemo(() => {
    if (!programData.degreePrograms) {
      return [];
    }
    return programData.degreePrograms.filter(degreeProgram => (
      degreeProgram.id.includes('minor')
    ));
  }, [programData.degreePrograms]);
  
  const handleSignOut: () => Promise<void> = useCallback(async () => {
    await signOut({
      redirect: true,
      callbackUrl: '/',
    });
  }, []);

  const yearOptions: SelectionOption[] = useMemo(() => {
    const select = {
      label: 'Select a year',
      id: 'Select a year',
      onClick: () => handlers.handleYearChange(null)
    };
    const years = [1, 2, 3, 4].map(year => ({
      label: String(year),
      id: String(year),
      onClick: () => handlers.handleYearChange(year)
    }));

    return [select, ...years];
  }, []);

  const filterDegreePrograms: (
    searchValue: string, 
    type: DegreeProgramType
  ) => SelectionOption[] = useCallback((searchValue, type) => {

    if (!nonMinorItems) {
      return [];
    }

    let filteredItems: DegreeProgram[] = nonMinorItems;
    if (searchValue && searchValue !== '') { /** If search value is a real string, remove 'select' option */
      const tokens: string[] = searchValue.split(' ');
      if (tokens.length <= 2) {
        filteredItems = nonMinorItems.filter((item: DegreeProgram) => (
          item.name.toLowerCase().includes(searchValue)
        ));
      } else {
        /** 
         * If we compute that the number of tokens is larger than 2,
         * ensure that every token is present (without regard to order),
         * AND that the first two tokens are present as is.
         */
        const firstTwoTokens = searchValue.substring(0, searchValue.indexOf(' ', searchValue.indexOf(' ') + 1));
        filteredItems = nonMinorItems.filter((item: DegreeProgram) => (
          tokens.every(token => item.name.toLowerCase().includes(token)) && item.name.toLowerCase().includes(firstTwoTokens)
        ));
      }
    }

    const selectId = type === 'primary' ? 'Select a degree program' : 'Select a secondary degree program';
    const select = {
      label: selectId,
      id: selectId,
      onClick: () => type === 'primary' ? handlers.handleDegreeProgramChange(null) : handlers.handleSecondaryDegreeProgramChange(null)
    };
    const degreeItems = filteredItems.map((program: DegreeProgram) => ({
      label: program.name,
      id: program.id,
      onClick: () => type === 'primary' ? handlers.handleDegreeProgramChange(program.id) : handlers.handleSecondaryDegreeProgramChange(program.id)
    }));
    return [select, ...degreeItems];
  }, [nonMinorItems]);

  const degreeProgramOptions: SelectionOption[] = useMemo(() => {
    if (!nonMinorItems) {
      return [];
    }
    return filterDegreePrograms('', 'primary');
  }, [nonMinorItems]);

  const secondaryDegreeProgramOptions: SelectionOption[] = useMemo(() => {
    if (!nonMinorItems) {
      return [];
    }
    return filterDegreePrograms('', 'secondary');
  }, [nonMinorItems]);

  const filterMinorProgramOptions: (searchValue: string) => SelectionOption[] = useCallback((searchValue) => {
    if (!minorItems) {
      return [];
    }

    let filteredMinors: any[] = minorItems;
    if (searchValue && searchValue !== '') {
      filteredMinors = minorItems.filter((item: DegreeProgram) => (
        item.name.toLowerCase().includes(searchValue)
      ));
    }
    const select = {
      label: 'Select a minor',
      id: 'Select a minor',
      onClick: () => handlers.handleMinorProgramChange(null)
    };
    const filteredOptions = filteredMinors.map((program: DegreeProgram) => ({
      label: program.name,
      id: program.id,
      onClick: () => handlers.handleMinorProgramChange(program.id)
    }));
    return [select, ...filteredOptions];
  }, [minorItems]);

  const minorProgramOptions: SelectionOption[] = useMemo(() => {
    if (!minorItems) {
      return [];
    }
    return filterMinorProgramOptions('');
  }, [minorItems]);

  return (
    <div className="flex-grow w-4/5 mx-auto">
      <div className="my-8 p-8 rounded bg-white flex flex-col gap-6 shadow-sm">
        <div className="flex flex-col gap-1">
          <h1 className="heading-md">{databaseData.profile?.name}</h1>
          <p className="text-md text-gray-400">
            Signed in with {databaseData.profile?.provider} ({databaseData.profile?.email})
          </p>
        </div>
        <div className="grid grid-cols-[auto_1fr] gap-y-4 gap-x-10 text-md items-center">
          <p className="text-md">Year</p>
          <Skeleton 
            isLoaded={!degreesLoading} 
            className="w-full inline-block max-w-96"
          >
            <SelectionDropdown 
              options={yearOptions}
              text={!data.year ? 'Select a year' : `${suffixDict[data.year]} year`}
              selectedOption={!data.year ? 'Select a year' : String(data.year)}
            />
          </Skeleton>

          <div className="flex flex-row gap-2">
            <p className="text-md">Level</p>
            <NextToolTip content={'Inferred from your primary degree program.'}>
              <InfoIcon 
                style={{ 
                  width: '18px' 
                }} 
              />
            </NextToolTip>
          </div>
          <p className="text-sm">{data.level}</p>

          <p className="text-md">Degree Program</p>
          <Skeleton 
            isLoaded={!degreesLoading} 
            className="w-full inline-block max-w-96"
          >
            <SelectionDropdown 
              options={degreeProgramOptions}
              text={!data.degreeProgram 
                ? 'Select a degree program' 
                : programMaps.degreePrograms!.get(data.degreeProgram)!.name
              }
              selectedOption={!data.degreeProgram 
                ? 'Select a degree program' 
                : data.degreeProgram
              }
              containsSearch
              searchString={'Search for a degree program...'}
              filterOptions={filterDegreePrograms}
              filterType={'primary'}
            />
          </Skeleton>

          <div className="flex flex-row gap-2">
            <p className="text-md">Secondary degree program</p>
            <NextToolTip content={'This is completely optional'}>
              <InfoIcon 
                style={{ 
                  width: '18px' 
                }} 
              />
            </NextToolTip>
          </div>

          <Skeleton 
            isLoaded={!degreesLoading} 
            className="w-full inline-block max-w-96"
          >
            <SelectionDropdown 
              options={secondaryDegreeProgramOptions}
              text={!data.secondaryDegreeProgram 
                ? 'Select a secondary degree program' 
                : programMaps.degreePrograms!.get(data.secondaryDegreeProgram)!.name
              }
              selectedOption={!data.secondaryDegreeProgram 
                ? 'Select a degree program' 
                : data.secondaryDegreeProgram
              }
              containsSearch
              searchString={'Search for a degree program...'}
              filterOptions={filterDegreePrograms}
              filterType={'secondary'}
            />
          </Skeleton>

          <div className="flex flex-row gap-2">
            <p className="text-md">Minor</p>
            <NextToolTip content={'This is also optional'}>
              <InfoIcon 
                style={{ 
                  width: '18px' 
                }} 
              />
            </NextToolTip>
          </div>

          <Skeleton 
            isLoaded={!degreesLoading} 
            className="w-full inline-block max-w-96"
          >
            <SelectionDropdown 
              options={minorProgramOptions}
              text={!data.minorProgram 
                ? 'Select a minor program' 
                : programMaps.degreePrograms!.get(data.minorProgram)!.name
              }
              selectedOption={!data.minorProgram 
                ? 'Select a minor program' 
                : data.minorProgram
              }
              containsSearch
              searchString={'Search for a minor program...'}
              filterOptions={filterMinorProgramOptions}
            />
          </Skeleton>

          <p className="text-md">Created at</p>
          <Skeleton 
            isLoaded={!degreesLoading} 
            className="w-full inline-block max-w-96"
          >
            <p className="text-sm">{formatDate(data.createdAt!)}</p>
          </Skeleton>
        </div>

        <div className="w-fit py-4">
          <Button 
            color="default" 
            onClick={handleSignOut} 
            className="bg-prussian-blue fit-content" 
            startContent={
              <LogoutIcon 
                style={{ 
                  width: '20px' 
                }}
              />
            }
            style={{ 
              color: 'var(--background-hex)' 
            }}
          >
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ProfilePageClient;