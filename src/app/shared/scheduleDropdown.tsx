import { FC, useCallback, useEffect, useMemo, useRef, useState } from "react";
import HelperDropdown, { HelperDropdownOption } from "../components/helperDropdown";
import { useProfile } from "../contexts/server/profile/provider";
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import { ScheduleInfo, updateSchedule } from "../api/schedule";
import { MutableRef } from "../degree-plan/termTable";
import DeleteIcon from '@mui/icons-material/Delete';
import { useDegreePlanContext } from "../client-contexts/degreePlanContext";

export interface ScheduleDropdownProps {
  selectedOption: string;
}

const ScheduleDropdown: FC<ScheduleDropdownProps> = ({
  selectedOption: initSelectedOption,
}: ScheduleDropdownProps) => {

  /** in case the helper has an input field */
  const [helperValue, setHelperValue] = useState<string | null>(null);

  /** ID of the helper which is currently selected */
  const [activeHelper, setActiveHelper] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(initSelectedOption);
  const [activeIndex, setActiveIndex] = useState<number | null>(0);

  const [inEditMode, setInEditMode] = useState<boolean>(false);
  const [editValues, setEditValues] = useState<Map<string, string> | null>(null);
  const [currentlyEditing, setCurrentlyEditing] = useState<string | null>(null);
  const [pendingEditChange, setPendingEditChange] = useState<boolean>(false);
  const [tempName, setTempName] = useState<string | null>(null);
  const [deletedScheduleId, setDeletedScheduleId] = useState<string | null>(null);

  const helperRef = useRef<HTMLInputElement | null>(null);
  const editRefs = useRef<Map<string, MutableRef<HTMLInputElement>>>(new Map());

  const { 
    createNewSchedule, 
    replaceScheduleAssignment, 
    scheduleEdited,
    tempInfoObject,
    deleteSchedulePing 
  } = useDegreePlanContext();

  const { 
    schedules, 
    refetchSchedules 
  } = useProfile();

  useEffect(() => {
    if (schedules) {
      /** Every time schedules updates */
      const editMap: Map<string, string> = new Map();
      schedules!.forEach(schedule => {
        editMap.set(schedule.schedule_id, '');
      })
      setEditValues(editMap);
      setPendingEditChange(false);
    }
  }, [schedules]);

  useEffect(() => {
    if (tempInfoObject) {
      setSelectedOption(tempInfoObject.schedule_id);
    }
  }, [tempInfoObject]);

  /** Upon the input being available, focus */
  useEffect(() => {
    if (helperRef && helperRef.current) {
      helperRef.current!.focus();
    }
  }, [helperRef, activeHelper]);

  useEffect(() => {
    if (inEditMode) {
      /** Toggle the first editRef available */
      editRefs.current.get(schedules![0].schedule_id)!.current!.focus();
      setCurrentlyEditing(schedules![0].schedule_id);
      setActiveIndex(0);
    } else {
      /** Reset edit values */
      setEditValues(new Map(schedules?.map(schedule => [schedule.schedule_id, ''])));
    }
  }, [inEditMode, schedules]);

  const onValueChange: (value: string) => void = useCallback((value) => {
    setHelperValue(value);
  }, []);

  const onEditChange: (id: string, value: string) => void = useCallback((id, value) => {
    setEditValues(prev => {
      const newMap = new Map(prev);
      newMap.set(id, value);
      return newMap;
    });
  }, []);

  const handleKeyDownEdits: (e: React.KeyboardEvent<HTMLInputElement>, schedule: ScheduleInfo) => void = useCallback(async (e, schedule) => {
    switch (e.key) {
      case 'Enter':
        /** Acts as a placeholder until ping finishes */
        setTempName(editValues?.get(schedule.schedule_id)!);
        setPendingEditChange(true);
        setInEditMode(false);
        if (editValues && editValues?.get(schedule.schedule_id) !== schedule.name) {
          /** 
           * Since updating a schedule name doesn't change the degree plan in any way, we can just call
           * it without using the hook.
           */
          await updateSchedule(schedule.schedule_id, editValues!.get(schedule.schedule_id)!);
          await refetchSchedules();
        }
        setCurrentlyEditing(null);
        setTempName(null);
        setPendingEditChange(false);
        break;
      default:
        return;
    }
  }, [editValues]);

  const handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void = useCallback(async (e) => {
    switch (e.key) {
      case 'Enter':
        setIsOpen(false);
        setActiveHelper(null);
        if (helperValue) {
          /** 
           * await createNewSchedule CALLS refetchSchedules() for us.
           *  
           * In addition, it'll create a temp info object which we grab
           * and assign as our selected schedule. But we don't actually update
           * schedules with our temp object, as this defeats the purpose of doing
           * it in real time. Instead, simply pass in the temp object to the helper
           * dropdown and if it discovers it has one, it'll show the helper value
           * we just put (mimicking the instance of a real object).
           */
          const newSchedule = await createNewSchedule(helperValue!)!;
          setPendingEditChange(true);
          setSelectedOption(newSchedule!.schedule_id);
        }
        setHelperValue('');
        break;
      case 'ArrowDown':
        break;
      case 'ArrowUp':
        break;
      default:
        return;
    }
    e.preventDefault();
  }, [helperValue]);

  const swapCurrentlyEditing: (scheduleId: string) => void = useCallback((scheduleId) => {
    if (editRefs.current.get(scheduleId)) {
      editRefs.current.get(scheduleId)!.current!.focus();
    }
    setCurrentlyEditing(scheduleId);
  }, [editRefs]);

  const incrementIndex: () => void = useCallback(() => {
    if (!schedules) {
      return;
    }
    const n = schedules!.length; /** Size of dropdown */
    const newIndex = Math.min(activeIndex! + 1, n);
    if (newIndex < n) {
      swapCurrentlyEditing(schedules[newIndex].schedule_id);
    } else {
      editRefs.current.get(schedules[n - 1].schedule_id)!.current!.blur();
      setCurrentlyEditing(null);
    }
    setActiveIndex(newIndex);
  }, [activeIndex, schedules, swapCurrentlyEditing]);

  const decrementIndex: () => void = useCallback(() => {
    if (!schedules) {
      return;
    }
    const newIndex = Math.max(activeIndex! - 1, -1);
      if (newIndex >= 0) {
        swapCurrentlyEditing(schedules[newIndex].schedule_id);
      } else {
        editRefs.current.get(schedules[0].schedule_id)!.current!.blur();
        setCurrentlyEditing(null);
      }
      setActiveIndex(newIndex);
  }, [activeIndex, schedules, swapCurrentlyEditing]);

  const handleShortcuts: (e: KeyboardEvent) => void = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      incrementIndex();
    } else if (e.key === 'ArrowUp') {
      decrementIndex();
    }
  }, [incrementIndex, decrementIndex]);

  useEffect(() => {
    window.addEventListener('keydown', handleShortcuts);
    return () => {
      window.removeEventListener('keydown', handleShortcuts); 
    };
  }, [handleShortcuts]);

  const editScheduleNode: (schedule: ScheduleInfo, idx: number) => React.ReactNode | null = useCallback((schedule, idx) => {
    if (!schedules || pendingEditChange) {
      return null;
    }
    return (
      <div
        className={`
          min-w-56 px-4 py-2 text-left text-sm bg-white rounded-none
          ${idx === 0 ? 'border-t' : ''} 
          border-l border-r border-gray-200 relative flex flex-col gap-0
        `}
      >
        <div className="flex flex-row gap-2 items-center justify-between">
          <input
            id="schedule-name"
            type="text"
            value={editValues?.get(schedule.schedule_id)!}
            onClick={() => {
              swapCurrentlyEditing(schedule.schedule_id);
              setActiveIndex(idx);
            }}
            onChange={(e) => {
              e.stopPropagation();
              onEditChange(schedule.schedule_id, e.target.value);
            }}
            onKeyDown={(e) => handleKeyDownEdits(e, schedule)}
            ref={(el) => {
              if (el) {
                editRefs.current.set(schedule.schedule_id, { 
                  current: el 
                });
              }
            }}
            autoComplete="off"
            placeholder={editValues?.get(schedule.schedule_id)!.length === 0 ? schedule.name! : ''}
            className={`
              min-w-32 text-sm outline-none border-b 
            `}
          />
          <DeleteIcon 
            style={{ width: '16px' }} 
            className={`
              opacity-50 hover:opacity-100
              hover:scale-110 cursor-pointer transition-transform
            `}
            onClick={(e) => {
              e.stopPropagation(); 
              deleteSchedulePing(schedule);
              setDeletedScheduleId(schedule.schedule_id);
            }}
          />
        </div>
        {currentlyEditing === schedule.schedule_id && editValues!.get(schedule.schedule_id)!.length > 0 && (
          <div className="flex flex-row justify-start">
            <p className="w-fit text-xs p-0">previously: {schedule.name}</p>
          </div>
        )}
      </div>
    );
  }, [tempName, schedules, editValues, onEditChange, currentlyEditing, pendingEditChange, handleKeyDownEdits, swapCurrentlyEditing]);

  const createScheduleNode: React.ReactNode = useMemo(() => {
    return (
      <div className="flex items-center max-h-8">
        <div className="h-[2px] w-10 bg-gray-300 top-10" />  {/** Gives impression of a connection line */}
        <div className="flex flex-row gap-4 bg-white px-4 py-2 whitespace-nowrap items-center border border-1 border-gray-200 rounded-none shadow-md">
          <p className="text-sm">Enter a schedule name</p>
          <input
            id="schedule-name"
            type="text"
            value={helperValue || ''}
            onChange={(e) => onValueChange(e.target.value)}
            onKeyDown={handleKeyDown}
            ref={helperRef}
            autoComplete="off"
            placeholder={``}
            className="min-w-32 text-sm outline-none border-b"
          />
        </div>
      </div>
    );
  }, [helperValue, helperRef]);

  const scheduleOptions: HelperDropdownOption[] = useMemo(() => {
    if (!schedules) {
      return [];
    }
    const createNewScheduleOption: HelperDropdownOption = {
      label: 'Create a new schedule',
      id: 'create-new',
      isHelper: true,
      isLastHelper: false,
      customDisplayNode: (
        <div className="flex flex-row items-center gap-2">
          <AddIcon style={{ width: '20px', height: '20px' }}/>
          <p className="text-sm">Create a new schedule</p>
        </div> 
      ),
      customHelperNode: createScheduleNode,
    };
    const editScheduleOption: HelperDropdownOption = {
      label: 'Edit schedules',
      id: 'edit',
      isHelper: true,
      isLastHelper: true,
      customDisplayNode: (
        <div className="flex flex-row items-center gap-2">
          <EditIcon style={{ width: '16px', height: '16px' }}/>
          <p className="text-sm">Edit schedules</p>
        </div> 
      ),
      /** No custom helper node */
    };
    const selectAScheduleOption: HelperDropdownOption = {
      label: 'Select a schedule',
      id: 'select',
      onClick: () => {
        setActiveIndex(0);
        setSelectedOption('select');
        if (inEditMode) {
          setInEditMode(false);
          setCurrentlyEditing(null);
        } else {
          replaceScheduleAssignment(null);
        }
      },
      isHelper: false,
    };
    return [
      createNewScheduleOption,
      editScheduleOption,
      selectAScheduleOption,
      ...schedules.filter(schedule => schedule.schedule_id !== deletedScheduleId)!.map((schedule, idx) => ({
        /** 
         * Currently ediitng below helps track if we're still in the modifiying state (schedules hasn't been refetched),
         * indicating that even if we aren't in editMode anymore we should still show the most recently updated value.
         */
        label: currentlyEditing === schedule.schedule_id && pendingEditChange ? tempName! : schedule.name!,
        id: schedule.schedule_id,
        onClick: () => {
          setActiveIndex(schedules.findIndex(el => el.schedule_id === schedule.schedule_id));
          replaceScheduleAssignment(schedule);
          setSelectedOption(schedule.schedule_id);
        },
        isHelper: false,
        editNode: editScheduleNode(schedule, idx)
        /** 
         * It might also be possible to create a regularNode field instead of pasting
         * the information inside helperdropdown, but likely unnecessary
         */
      }))
    ];
  }, [tempName, currentlyEditing, editValues, schedules, replaceScheduleAssignment, createScheduleNode, editScheduleNode, deletedScheduleId]);

  return (
    <HelperDropdown
      options={scheduleOptions}
      selectedOption={selectedOption}
      hasHelper={true}
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      inEditMode={inEditMode}
      setInEditMode={setInEditMode}
      setCurrentlyEditing={setCurrentlyEditing}
      optionEdited={scheduleEdited}
      tempObject={tempInfoObject}
      helperValue={helperValue}
      setHelperValue={setHelperValue}
      activeHelper={activeHelper}
      setActiveHelper={setActiveHelper}
      incrementIndex={incrementIndex}
      decrementIndex={decrementIndex}
    />
  );
}

export default ScheduleDropdown;