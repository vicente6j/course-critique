import { FC, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDegreePlan } from "../hooks/useDegreePlan";
import HelperDropdown, { HelperDropdownOption } from "../components/helperDropdown";
import { useProfile } from "../server-contexts/profile/provider";
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import { ScheduleInfo } from "../api/schedule";
import { MutableRef } from "../degree-plan/termTable";

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
  const [inEditMode, setInEditMode] = useState<boolean>(false);
  const [editValues, setEditValues] = useState<Map<string, string> | null>(null);

  const helperRef = useRef<HTMLInputElement | null>(null);
  const editRefs = useRef<Map<string, MutableRef<HTMLInputElement>>>(new Map());

  const { 
    createNewSchedule, 
    replaceScheduleAssignment, 
    scheduleEdited,
    tempInfoObject 
  } = useDegreePlan();
  const { schedules } = useProfile();

  useEffect(() => {
    if (!editValues && schedules) {
      const editMap: Map<string, string> = new Map();
      schedules!.forEach(schedule => {
        editMap.set(schedule.schedule_id, schedule.name!);
      })
      setEditValues(editMap);
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

  const handleKeyDownEdits: (e: React.KeyboardEvent<HTMLInputElement>) => void = useCallback(async (e) => {
    switch (e.key) {
      case 'Enter':
        setInEditMode(false);
        /** ping schedule API */
        break;
      default:
        return;
    }
  }, []);

  const handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void = useCallback(async (e) => {
    switch (e.key) {
      case 'Enter':
        setIsOpen(false);
        setActiveHelper(null);
        if (helperValue) {
          /** 
           * Calls refetchSchedules() for us 
           * In addition, it'll create a temp info object which we grab
           * and assign as our selected schedule. But we don't actually update
           * schedules with our temp object, as this defeats the purpose of doing
           * it in real time. Instead, simply pass in the temp object to the helper
           * dropdown and if it discovers it has one, it'll show the helper value
           * we just put (mimicking the instance of a real object).
           */
          const newSchedule = await createNewSchedule(helperValue!)!;
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

  const editScheduleNode: (id: string, idx: number) => React.ReactNode | null = useCallback((id, idx) => {
    if (!schedules) {
      return null;
    }
    return (
      <div
        className={`
          ${selectedOption === id ? 'bg-gray-100' : ''} 
          min-w-56 px-4 py-2 text-left hover:bg-gray-100 text-sm bg-white rounded-none
          ${idx === 0 ? 'border-t' : idx === schedules.length - 1 ? 'border-b shadow-lg' : ''} 
          border-l border-r border-gray-200`
        }
      >
        <input
          id="schedule-name"
          type="text"
          value={editValues?.get(id)}
          onChange={(e) => onEditChange(id, e.target.value)}
          onKeyDown={handleKeyDownEdits}
          ref={(el) => {
            if (el) {
              editRefs.current.set(id, { 
                current: el 
              });
            }
          }}
          onFocus={() => {
            setSelectedOption(id);
          }}
          onBlur={() => {
            setSelectedOption(null);
          }}
          autoComplete="off"
          placeholder={``}
          className={`min-w-32 text-sm outline-none border-b ${selectedOption === id ? 'bg-gray-100' : ''} `}
        />
      </div>
    );
  }, [selectedOption, schedules, editValues]);

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
        replaceScheduleAssignment(null);
      },
      isHelper: false,
    };
    return [
      createNewScheduleOption,
      editScheduleOption,
      selectAScheduleOption,
      ...schedules!.map((schedule, idx) => ({
        label: schedule.name!,
        id: schedule.schedule_id,
        onClick: () => {
          replaceScheduleAssignment(schedule);
        },
        isHelper: false,
        editNode: editScheduleNode(schedule.schedule_id, idx)
      }))
    ];
  }, [schedules, replaceScheduleAssignment, createScheduleNode]);

  return (
    <HelperDropdown
      options={scheduleOptions}
      selectedOption={selectedOption}
      hasHelper={true}
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      inEditMode={inEditMode}
      setInEditMode={setInEditMode}
      optionEdited={scheduleEdited}
      tempObject={tempInfoObject}
      helperValue={helperValue}
      setHelperValue={setHelperValue}
      activeHelper={activeHelper}
      setActiveHelper={setActiveHelper}
    />
  );
}

export default ScheduleDropdown;