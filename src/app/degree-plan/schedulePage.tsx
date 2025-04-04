import { FC, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSchedulesContext } from "../hooks/schedules/schedulesContext";
import ScheduleTable from "./scheduleTable";
import { useSchedulesAssignmentsContext } from "../hooks/scheduleAssignments/scheduleAssignmentsContext";
import { useScheduleEntriesContext } from "../hooks/scheduleEntries/scheduleEntriesContext";
import SelectionDropdown, { SelectionOption } from "../components/selectionDropdown";
import { scheduleTerms } from "../metadata";
import ModeEditIcon from '@mui/icons-material/ModeEdit';

export interface SchedulePageProps {}

export const SchedulePage: FC<SchedulePageProps> = ({

}: SchedulePageProps) => {

  const [scheduleSelected, setScheduleSelected] = useState<string | null>(null);
  const [termSelected, setTermSelected] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean | null>(false);
  const [nameInput, setNameInput] = useState<string | null>(null);
  const [editorHeight, setEditorHeight] = useState<number>(0);

  const initLoadComplete = useRef<boolean | null>(false);
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const editorRef = useRef<HTMLDivElement | null>(null);
  
  const {
    schedules,
    scheduleMap,
    handlers: scheduleHandlers
  } = useSchedulesContext();

  const {
    entryMap
  } = useScheduleEntriesContext();

  const {
    scheduleAssignmentsMap,
  } = useSchedulesAssignmentsContext();

  const updateHeights: () => void = useCallback(() => {
    const fontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
    if (editorRef.current) {
      setEditorHeight(editorRef.current.scrollHeight / fontSize);
    }
  }, []);

  useEffect(() => {
    updateHeights();
    window.addEventListener('resize', updateHeights);
    return () => window.removeEventListener('resize', updateHeights);
  }, [updateHeights]);

  useEffect(() => {
    if (schedules && scheduleAssignmentsMap && !initLoadComplete.current) {
      setScheduleSelected(schedules[0].schedule_id);
      initLoadComplete.current = true;
    }
  }, [schedules, scheduleAssignmentsMap, initLoadComplete.current]);

  useEffect(() => {
    if (scheduleSelected && scheduleAssignmentsMap && scheduleAssignmentsMap.has(scheduleSelected)) {
      setTermSelected(scheduleAssignmentsMap.get(scheduleSelected)!.term);
    } else {
      setTermSelected(null);
    }
    updateHeights();
  }, [scheduleSelected, scheduleAssignmentsMap]);

  const termOptions: SelectionOption[] = useMemo(() => {
    const select = {
      label: 'Select a term',
      id: 'select',
      onClick: () => setTermSelected(null)
    };
    const terms = scheduleTerms.map(term => ({
      label: term,
      id: term,
      onClick: () => setTermSelected(term)
    }))

    return [select, ...terms];
  }, []);

  const onInputNameChange: (value: string) => void = useCallback((value) => {
    setNameInput(value);
  }, []);

  const handleNameKeyDown: (
    e: React.KeyboardEvent<HTMLInputElement>, 
  ) => void = useCallback(async (e) => {
    if (!scheduleSelected || !nameInput) {
      return;
    }
    switch (e.key) {
      case 'Enter':
        setIsEditing(false);
        setNameInput('');
        await scheduleHandlers.updateSchedule(scheduleSelected!, nameInput);
        break;
      default:
        return;
    }
    e.preventDefault();
  }, [scheduleHandlers, scheduleSelected, nameInput]);

  useEffect(() => {
    nameInputRef.current?.focus();
  }, [isEditing]);

  return (
    <div 
      className="flex flex-col gap-0 w-full bg-white shadow-lg pt-4"
      ref={editorRef}
    >
      <div className="flex flex-col gap-1 px-8 pb-6 pt-2 border-b border-gray-200">
        <p className="heading-md">My Schedules</p>
        <p className="text-sm">Found {schedules?.length || 0}</p>
      </div>
        <div className="flex flex-row justify-between">
        <div className="flex flex-col gap-0 w-[20%] border-r border-gray-200">
          {schedules?.map(schedule => {
            const numEntries = entryMap?.get(schedule.schedule_id)?.length || 0;
            return (
              <div 
                className={`
                  py-4 px-8 border-b border-gray-200 hover:bg-gray-100 cursor-pointer 
                  ${scheduleSelected === schedule.schedule_id ? 'bg-gray-100' : ''}
                `}
                key={schedule.schedule_id}
                onClick={() => {
                  setScheduleSelected(schedule.schedule_id);
                }}
              >
                <p className="text-md">{schedule.name}</p>
                <p className="text-sm">
                  {numEntries} {numEntries === 1 ? 'entry' : 'entries'}
                </p>
              </div>
            );
          })}
        </div>
        <div className="flex flex-col gap-3 w-[80%] py-8 px-8">
          <div 
            className="relative cursor-pointer w-fit flex flex-row gap-3 items-center"
            onClick={() => {
              setIsEditing(!isEditing);
            }}
          >
            {isEditing ? (
              <input
                id={`schedule-name-field`}
                type="text"
                ref={nameInputRef}
                value={nameInput || ''}
                onChange={(e) => {
                  onInputNameChange(e.target.value);
                }}
                onKeyDown={(e) => handleNameKeyDown(e)}
                className={`
                  bg-transparent z-20 cursor-text outline-none w-160 border-b border-gray-400
                  heading-md font-loose
                `}
                placeholder={scheduleMap?.get(scheduleSelected!)?.name || ''}
              />
            ) : (
              <div className="flex flex-row gap-3 items-center hover:bg-gray-100">
                <p className="heading-md font-loose">{scheduleMap!.get(scheduleSelected!)?.name}</p>
                <ModeEditIcon 
                  style={{
                    width: '20px'
                  }}
                />
              </div>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <SelectionDropdown 
              options={termOptions}
              selectedOption={termSelected ?? 'select'}
              text={termSelected ?? 'Select a term'}
            />
            <ScheduleTable 
              scheduleId={scheduleMap!.get(scheduleSelected!)?.schedule_id || null}
              term={termSelected}
            />
          </div>
        </div>
        {isEditing && (
          <div 
            className="fixed inset-0 z-10" 
            onClick={(e) => {
              e.stopPropagation();  
              setIsEditing(false);
            }}
          />
        )}
      </div>
    </div>
  )
}

export default SchedulePage;