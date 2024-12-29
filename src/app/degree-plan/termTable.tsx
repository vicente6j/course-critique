'use client'
import { Dispatch, FC, SetStateAction, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
  getKeyValue,
} from "@nextui-org/table";
import { formatGPA } from "../shared/gradeTable";
import { Link } from "@nextui-org/react";
import { useRouter } from "next/navigation";
import DeleteIcon from '@mui/icons-material/Delete';
import { Kbd } from "@nextui-org/kbd";
import { Tooltip as NextToolTip } from "@nextui-org/tooltip";
import InfoIcon from '@mui/icons-material/Info';
import { CourseInfo } from "../api/course";
import { useCourses } from "../server-contexts/course/provider";
import { useProfile } from "../server-contexts/profile/provider";
import { createSchedule, ScheduleInfo } from "../api/schedule";
import AddIcon from '@mui/icons-material/Add';
import ScheduleDropdown from "./scheduleDropdown";
import { createScheduleAssignment, deleteScheduleAssignment, updateScheduleAssignment } from "../api/schedule-assignments";
import { useDegreePlanContext } from "../client-contexts/degreePlanContext";
import { useTermSelectionContext } from "../client-contexts/termSelectionContext";
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ActionDropdown from "../shared/actionDropdown";

export interface TermTableColumn {
  key: string;
  label: string;
  width: string;
}

export const columns: TermTableColumn[] = [
  { key: "course_id", label: "Course ID", width: 'w-[20%]' },
  { key: "course_name", label: "Course Name", width: 'w-[40%]' },
  { key: "GPA", label: "Average GPA", width: 'w-[20%]' },
  { key: "num_credits", label: "Num Credits", width: 'w-[15%]' },
  { key: "actions", label: "", width: 'w-[5%]' },
];

export interface TermTableRow {
  key: string;
  [key: string]: number | string;
}

interface MutableRef<T> {
  current: T | null;
}

export interface TermTableProps {
  term: string;
}

export type Course = CourseInfo | null;

const TermTable: FC<TermTableProps> = ({
  term
}: TermTableProps) => {
  
  const [emptyIndex, setEmptyIndex] = useState<number>(1);
  const [scheduleRows, setScheduleRows] = useState<TermTableRow[] | null>(null);
  const [queryValues, setQueryValues] = useState<Map<string, string>>(new Map());
  const [activeResults, setActiveResults] = useState<Map<string, string | null>>(new Map());
  const [error, setError] = useState<string | null>(null);
  const [previousRow, setPreviousRow] = useState<TermTableRow | null>(null);
  const [rerenderCount, setRerenderCount] = useState<number | null>(0);
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const [schedule, setSchedule] = useState<ScheduleInfo | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  /**
   * The purpose of this temp info object is to reduce the latency between
   * creating a new schedule and actually seeing it on the client. e.g. I hit
   * create a new schedule, but I have yet to retrieve the new schedule object
   * from the back-end. So use this temp info object for rendering and swap it out
   * later.
   */
  const [tempInfoObject, setTempInfoObject] = useState<ScheduleInfo | null>(null);

  const inputRefs = useRef<Map<string, MutableRef<HTMLInputElement>>>(new Map());
  const tableRef = useRef<HTMLDivElement | null>(null);

  const { courses, courseMap, averagesMap } = useCourses();
  const { handleUnselectTerm } = useTermSelectionContext();
  const { termScheduleMap, setTermScheduleMap, termSelected, setTermSelected } = useDegreePlanContext();
  const { profile, 
    schedules, 
    refetchSchedules, 
    scheduleMap, 
    scheduleEntryMap, 
    scheduleAssignments, 
    refetchScheduleAssignments 
  } = useProfile();

  const router = useRouter();

  /** Runs every instance of activeKey changing (extremely regularly) */
  useEffect(() => {
    setRerenderCount(prev => prev! + 1);
  }, [activeKey]);

  useEffect(() => {
    setIsEditing(
      (scheduleRows ? scheduleRows!.some(schedule => schedule.key.startsWith('XX')) : false)
        && activeKey !== null
    );
  }, [scheduleRows, activeKey]);

  const scheduleId: string | null = useMemo(() => {
    if (!termScheduleMap) {
      return null;
    }
    return termScheduleMap.get(term) || null;
  }, [termScheduleMap]);

  const fetchScheduleEntries: () => void = useCallback(() => {
    if (!scheduleEntryMap) {
      return;
    } else if (!scheduleId || !scheduleEntryMap.has(scheduleId)) {
      /** Schedule exists but it has no entries */
      setScheduleRows([{
        key: 'XX 0000',
        course_id: 'XX 0000',
      }]);
      return;
    }
    let rows: TermTableRow[] = [];
    for (const entry of scheduleEntryMap.get(scheduleId)!) {
      rows.push({
        key: entry.course_id!,
        course_id: entry.course_id!,
      });
    }
    if (rows.length === 0) {
      rows.push({
        key: 'XX 0000',
        course_id: 'XX 0000',
      });
    }
    setScheduleRows(rows);
  }, [scheduleId, scheduleEntryMap]);

  const fetchSchedule: () => void = useCallback(() => {
    if (!scheduleMap || !scheduleId) {
      setSchedule(null);
      return;
    } else if (tempInfoObject && termSelected === term) { 
      /** This makes sure that it's only the selected term which is updated */
      setSchedule(tempInfoObject)
      return;
    }
    setSchedule(scheduleMap.get(scheduleId)!);
  }, [scheduleId, scheduleMap, tempInfoObject, termSelected, term]);

  useEffect(() => {
    fetchScheduleEntries();
    fetchSchedule();
  }, [fetchScheduleEntries]);

  /**
   * This function has a few moving parts to it.
   * 1. Check to see if the row selected starts with 'XX'. This can mean
   * a few different things: either 
   * (a) you selected an empty row without having anything selected, or 
   * (b) you selected your own row or an empty row (might be the same) after having
   * something already selected.
   * 
   * In the case of (a), we simply want to trigger the input field. So we
   * set activeKey to key and rerender the table again.
   * In the case of (b), we have two options: if the row you selected is the same
   * as the one you're now deselecting (i.e. the empty row), just deselect and return.
   * Otherwise, you had a real row selected, so deselect that real row, and then select
   * the empty one.
   * 
   * 2. The row selected doesn't start with 'XX'. i.e. it's a real row.
   * In this case, we definitely want to add the updated edit row to our
   * scheduledRows, and we definitely want to deselect in the case that something
   * is previously selected. 
   */
  const handleSelectRow: (key: string) => void = useCallback((key: string) => {
    if (!scheduleRows) {
      return;
    }
    if (key.startsWith('XX')) {
      if (previousRow) {
        handleDeselect();
        /** If we just deselected an empty row */
        if (previousRow.key === key) {
          return;
        }
      }
      /** Activate the empty row, either from initial render or from having already selected a real row. */
      setActiveKey(key);
      setPreviousRow(scheduleRows.find(row => row.key === key)!);
      return;
    }
    let newRows: TermTableRow[] = previousRow ? handleDeselect() : scheduleRows;
    const paddedNumber = emptyIndex.toString().padStart(4, '0');
    setEmptyIndex(prev => prev + 1);
    let index = newRows.findIndex((row: TermTableRow) => row.key === key);
    let prevRow = newRows.find((row: TermTableRow) => row.key === key);
    setPreviousRow(prevRow!);

    const newKey = `XX ${paddedNumber}`;
    newRows = [
      ...newRows.slice(0, index),
      { ...newRows[index], key: newKey },
      ...newRows.slice(index + 1)
    ];
    setScheduleRows(newRows);
    setQueryValues((prev) => {
      const newDict = new Map(prev);
      newDict.set(newKey, key);
      return newDict;
    });
    setActiveResults((prev) => {
      const newDict = new Map(prev);
      newDict.set(newKey, key);
      return newDict;
    });
    setActiveKey(newKey);
  }, [emptyIndex, scheduleRows, rerenderCount, activeKey, previousRow]);

  /**
   * This function basically either 
   * (a) restores the original state of the table before selecting something.
   * e.g. I select a real row, then this function restores the row I selected
   * back into the table (no edit key).
   * (b) deselects an empty row, which is to say it sets active key to null
   * and returns.
   */
  const handleDeselect: () => TermTableRow[] = useCallback(() => {
    if (!activeKey) {
      return scheduleRows || [];
    } else if (activeKey.startsWith('XX') && previousRow!.key.startsWith('XX')) {
      setPreviousRow(null);
      setActiveKey(null);
      return scheduleRows || [];
    }
    let index = scheduleRows!.findIndex((row: TermTableRow) => row.key === activeKey);
    const newRows = [
      ...scheduleRows!.slice(0, index),
      { ...scheduleRows![index], key: previousRow!.key },
      ...scheduleRows!.slice(index + 1)
    ];
    setScheduleRows(newRows);
    removeFromDictionaries(activeKey!);
    setPreviousRow(null);
    setActiveKey(null);
    return newRows;
  }, [activeKey, scheduleRows, previousRow]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tableRef && !tableRef.current!.contains(event.target as Node) && termSelected === term) {
        handleDeselect();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handleDeselect, termSelected, term]);

  const filterCourses: (query: string) => Course[] = useCallback((query: string) => {
    if (!courses) {
      return [];
    } else if (!query) {
      return courses;
    }
    return courses?.filter(course => {
      return course.id.toLowerCase().startsWith(query!.toLowerCase());
    });
  }, [courses]);

  const removeFromDictionaries: (key: string) => void = useCallback((key: string) => {
    setQueryValues((prev) => {
      const newDict = new Map(prev);
      newDict.delete(key);
      return newDict;
    });
    setActiveResults((prev) => {
      const newDict = new Map(prev);
      newDict.delete(key);
      return newDict;
    });
  }, []);

  const addActiveCourse: (key: string) => Promise<void> = useCallback(async (key: string) => {
    try {
      const course_id = activeResults.get(key)!;
      let newRows: TermTableRow[] = [
        ...scheduleRows!.filter(row => row.key !== key && !row.key.startsWith('XX')),
        { key: course_id, course_id: course_id },
        ...scheduleRows!.filter(row => row.key !== key && row.key.startsWith('XX')) 
      ];
      if (!newRows.find((row: TermTableRow) => row.key.startsWith('XX'))) {
        /** Don't add if we already have an empty row */
        newRows = addEmptyRow(newRows);
      }
      /** At this point we might have already set scheduleRows, but it doesn't really matter */
      setScheduleRows(newRows);
      removeFromDictionaries(key);

      /** At this point we definitely have an empty row (or multiple), so select the first one */
      let firstEmptyIndex = newRows.findIndex((row: TermTableRow) => row.key.startsWith('XX'));
      setActiveKey(newRows[firstEmptyIndex].key);
      setPreviousRow(newRows[firstEmptyIndex])
      setRerenderCount((prev) => prev! + 1);

      /** Insert into db */
      if (course_id) {
        // await insertIntoSchedule(info!.schedule_id, course_id);
        // await refetchScheduleEntries();
      }
    } catch (error) {
      console.error(error);
      setError('Unable to insert into schedule');
    }
  }, [activeResults, scheduleRows]);

  const removeInsertedCourse: (key: string) => Promise<void> = useCallback(async (key: string) => {
    try {
      const newRows = [...scheduleRows!.filter(row => row.key !== key)];
      setScheduleRows(newRows);

      const activeIndex = scheduleRows?.findIndex(row => row.key === activeKey);
      if (newRows.some((row: TermTableRow) => row.key.startsWith('XX'))) {
        /** If we just deleted the empty row we were on */
        if (activeIndex === newRows.length) {
          setActiveKey(newRows[newRows.length - 1].key);
          setPreviousRow(newRows[newRows.length - 1]);
        } else {
          let newRow = newRows[activeIndex!];
          setActiveKey(newRow.key);
          setPreviousRow(newRow);
        }
      } else {
        setActiveKey(null);
        setPreviousRow(null);
      }
      removeFromDictionaries(key);
      /** Delete from db */
      if (!previousRow!.key.startsWith('XX')) {
        // await deleteFromSchedule(info!.schedule_id, previousRow!.key);
        // await refetchScheduleEntries();
      }
    } catch (error) {
      console.error(error);
      setError('Unable to remove from schedule');
    }
  }, [scheduleRows, previousRow, activeKey]);

  /**
   * Adds an empty row to scheduled rows (based on the current empty index to avoid collisions).
   * Optional param to pass in a collection of rows to filter.
   */
  const addEmptyRow: (rows?: TermTableRow[]) => TermTableRow[] = useCallback((rows?) => {
    if (scheduleRows!.length == 7) {
      /** Don't add more than seven courses */
      setError('Unable to insert more than seven courses.');
      return [];
    } 
    let myRows = rows ? rows : activeKey ? handleDeselect() : scheduleRows!;
    const paddedNumber = emptyIndex.toString().padStart(4, '0');
    setEmptyIndex((prev) => prev + 1);
    const key = `XX ${paddedNumber}`;

    let newRows: TermTableRow[] = [];
    let index = scheduleRows!.findIndex((row: TermTableRow) => row.key === activeKey);
    /** 
     * 1. If myRows is empty, just add the empty row and continue.
     * 2. If the current row selected isn't empty, just add the empty row underneath all the non
     * empty ones. Otherwise, add the empty row directly underneath our current row.
     */
    if (myRows.length === 0) {
      newRows = [{ key: key, course_id: 'XX 0000 '}];
    } else if (index! < 0 || index! >= myRows.length || !myRows[index!].key.startsWith('XX')) {
      newRows = [ 
        ...myRows.filter(row => !row.key.startsWith('XX')), 
        { key: key, course_id: 'XX 0000' }, 
        ...myRows.filter(row => row.key.startsWith('XX'))
      ];
    } else {
      newRows = [
        ...myRows.slice(0, index! + 1),
        { key: key, course_id: 'XX 0000' }, 
        ...myRows.slice(index! + 1)
      ];
    }
    setScheduleRows(newRows);
    setActiveKey(key);
    setPreviousRow(newRows.find(row => row.key === key)!);
    return newRows;
  }, [emptyIndex, scheduleRows, activeKey]);

  /**
   * Handles search value changing. Plus, manually retriggers a rerender in the case that
   * the key is the same (most of the time).
   */
  const onSearchChange: (value: string, key: string) => void = useCallback((value: string, key: string) => {
    setQueryValues((prev) => {
      const newDict = new Map(prev);
      newDict.set(key, value);
      return newDict;
    });
    setActiveResults((prev) => {
      const newDict = new Map(prev);
      if (value === '') {
        newDict.set(key, null);
      } else {
        const filteredCourses = filterCourses(value);
        newDict.set(key, filteredCourses.length === 0 ? null : filteredCourses[0]!.id);
      }
      return newDict;
    });
    setActiveKey(key);
    setRerenderCount(prev => prev! + 1); /** Manually rerender since key isn't changing */
  }, [filterCourses]);

  useEffect(() => {
    if (!activeKey) {
      return;
    }
    const inputRef = inputRefs.current.get(activeKey);
    if (inputRef?.current) {
      inputRef!.current.focus();
    }
  }, [rerenderCount]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const incrementIndex: () => void = useCallback(() => {
    if (!scheduleRows) {
      return;
    }
    let index = scheduleRows!.findIndex((row: TermTableRow) => row.key === activeKey);
    if (index === scheduleRows.length) {
      setError('No more rows to select');
    } else {
      setError('');
    }
    let newIndex = index === null ? 0 : Math.min(index + 1, scheduleRows.length);
    if (newIndex !== scheduleRows.length) {
      handleSelectRow(scheduleRows[newIndex].key);
    } else {
      handleDeselect();
    }
  }, [activeKey, scheduleRows]);

  const decrementIndex: () => void = useCallback(() => {
    if (!scheduleRows) {
      return;
    }
    let index = scheduleRows!.findIndex((row: TermTableRow) => row.key === activeKey);
    if (index === -1) {
      setError('No more rows to select');
    } else {
      setError('');
    }
    let newIndex = index === null ? scheduleRows.length - 1 : Math.max(index - 1, -1);
    if (newIndex !== -1) {
      handleSelectRow(scheduleRows[newIndex].key);
    } else {
      handleDeselect();
    }
  }, [activeKey, scheduleRows]);

  const handleShortcuts: (e: KeyboardEvent) => void = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && termSelected === term) {
      addEmptyRow();
    } else if (e.key === 'ArrowDown' && termSelected === term) {
      /** Start scrolling through items */
      incrementIndex();
    } else if (e.key === 'ArrowUp' && termSelected === term) {
      decrementIndex();
    } else if ((e.metaKey || e.ctrlKey) && e.key === 'Backspace' && termSelected === term) {
      if (!activeKey) {
        return;
      }
      removeInsertedCourse(activeKey);
    }
  }, [activeKey, termSelected]);

  useEffect(() => {
    window.addEventListener('keydown', handleShortcuts);
    return () => {
      window.removeEventListener('keydown', handleShortcuts);
    };
  }, [handleShortcuts]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>, key: string) => {
    /** Handles case of inserting rows with cmd-enter */
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && termSelected === term) {
      return;
    }
    switch (e.key) {
      case 'Enter':
        if (!activeResults.get(key) || activeResults.get(key)!.length === 0) {
          return;
        }
        addActiveCourse(key);
        const inputRef = inputRefs.current.get(key);
        if (inputRef?.current) {
          inputRef.current.blur();
        }
        break;
      case 'ArrowDown':
        break;
      case 'ArrowUp':
        break;
      default:
        return;
    }
    e.preventDefault();
  }, [addActiveCourse, activeResults]);

  const averageGpa: number | null = useMemo(() => {
    if (!scheduleRows || !averagesMap) {
      return null;
    }
    let average = 0;
    let credits = 0;
    for (const row of scheduleRows) {
      if (row.key.startsWith('XX')) {
        continue;
      }
      const courseGpa = averagesMap.get(row.key)?.GPA!;
      const numCredits = Number(courseMap?.get(row.key)!.credits!);
      average = (average * credits + courseGpa * numCredits) / (credits + numCredits);
      credits += numCredits;
    }
    return average;
  }, [scheduleRows, averagesMap]);

  const numCredits: number | null = useMemo(() => {
    if (!scheduleRows || !courseMap) {
      return null;
    }
    let numCredits = 0;
    for (const row of scheduleRows) {
      if (row.key.startsWith('XX')) {
        continue;
      }
      numCredits += Number(courseMap?.get(row.key)?.credits!);
    }
    return numCredits;
  }, [scheduleRows, courseMap]);

  const formatEmptyCourseID: (key: string) => JSX.Element = useCallback((key: string) => {
    return (
      <TableCell>
        <div className="relative rounded-lg max-h-xs rounded-none border-b border-gray-400 py-1 pr-1 z-10">
          <div className="absolute text-search bg-transparent outline-none !cursor-text !z-10">
            {/** Use uppercase here on all formatting */}
            {activeResults.has(key) && activeResults.get(key) ? (
              <>
                <span className="opacity-0">
                  {activeResults.get(key)?.slice(0, queryValues.get(key)!.length).toUpperCase()}
                </span>
                <span className="text-gray-400">
                  {activeResults.get(key)!.slice(queryValues.get(key)!.length).toUpperCase()}
                </span>
              </>
            ) : (
              <>
                <span className="text-gray-400">
                  {queryValues.has(key) && queryValues.get(key)!.length > 0 ? '' : '+XX 0000'}
                </span>
              </>
            )}
          </div>
          <div className="flex flex-row gap-0 items-center">
            {/** onFocus=(stop propagation) needed to prevent row from being selected */}
            <input
              id={`searchbar-${key}`}
              type="text"
              ref={(el) => {
                if (el) {
                  {/** This gets updated on each render, but it's fine (don't check if the map contains it) */}
                  inputRefs.current.set(key, { current: el });
                }
              }}
              value={queryValues.get(key)?.toUpperCase()}
              onChange={(e) => onSearchChange(e.target.value, key)}
              onFocus={(e) => e.stopPropagation()}
              onKeyDown={(e) => handleKeyDown(e, key)}
              placeholder=""
              className={`text-search bg-transparent z-2 outline-none w-80`}
            />
          </div>
        </div>
      </TableCell>
    );
  }, [activeResults, queryValues, rerenderCount, inputRefs]);

  const nextToolTipDisplayContent: JSX.Element = useMemo(() => {
    if (!scheduleRows) {
      return <></>;
    }
    const nonEmpty = scheduleRows.filter(row => !row.key.startsWith('XX'));
    return (
      <p>
        {`Weighted by number of credits for each class. ${nonEmpty.length !== 0 ? (
          `The value ${Number(averageGpa).toFixed(2)} is currently averaging 
            ${nonEmpty.map((row => {
              return ` ${row.key}`
            }))} (${nonEmpty.length} items)`
        ) : (
          ''
        )}`}
      </p>
    )
  }, [scheduleRows, averageGpa]);

  const replaceScheduleAssignment: (schedule: ScheduleInfo | string) => void = useCallback(async (schedule) => {
    if (!profile || !scheduleAssignments) {
      setError('Profile or assignments weren\'t found.');
      return;
    }

    try {
      if (typeof schedule === 'string') {
        if (schedule !== 'Select a schedule') {
          setError('Invalid schedule selection');
          return;
        }

        setTermScheduleMap(prev => {
          const newMap = new Map(prev);
          newMap.delete(term);
          return newMap;
        });

        /** Clears the selection */
        await deleteScheduleAssignment(term, profile!.id);
        await refetchScheduleAssignments();

        return;
      }

      /** This rerenders the entire component, since we're effectively passing in a new scheduleId */
      setTermScheduleMap(prev => {
        const newMap = new Map(prev);
        newMap.set(term, schedule.schedule_id);
        return newMap;
      });

      if (scheduleAssignments.some(assignment => assignment.term === term)) {
        await updateScheduleAssignment(term, schedule!.schedule_id!, profile!.id);
      } else {
        await createScheduleAssignment(schedule!.schedule_id!, term, profile!.id);
      }
      await refetchScheduleAssignments();

    } catch (e) {
      setError(e as string);
      console.error(e);
    }

  }, [profile, scheduleAssignments, term]);

  const createNewSchedule: (scheduleName: string) => void = useCallback(async (scheduleName) => {
    if (!profile || !schedules) {
      setError('One of profile or schedules was null.');
      return;
    }

    try {
      const tempSchedule: ScheduleInfo = {
        schedule_id: 'temp',
        user_id: profile.id,
        name: scheduleName,
        created_at: '',
        updated_at: '',
      };
      setTempInfoObject(tempSchedule);
      /**
       * Do this so that we can catch the brief case of a temp schedule_id and render what we want.
       */
      setTermScheduleMap(prev => {
        const newMap = new Map(prev);
        newMap.set(term, tempSchedule.schedule_id);
        return newMap;
      });

      /**
       * At this point the UX will have hopefully correctly rendered the name
       * and the empty schedule.
       */

      await createSchedule(profile!.id, scheduleName);
      const curSchedules: ScheduleInfo[] = [...schedules!];
      const newSchedules: ScheduleInfo[] = await refetchSchedules();
      /** 
       * curSchedules will help us find the difference between the new schedules and old (i.e. 
       * the new schedule we just created).
       */
      const newSchedule = newSchedules!.find(schedule => {
        return !curSchedules.some(oldSchedule => oldSchedule.schedule_id === schedule.schedule_id);
      });

      if (scheduleAssignments?.find(assignment => assignment.term === term)) {
        await updateScheduleAssignment(term, newSchedule!.schedule_id!, profile!.id);
      } else {
        await createScheduleAssignment(newSchedule!.schedule_id!, term, profile!.id);
      }
      await refetchScheduleAssignments();

      /** Once this context finishes updating, termGrid will reapply declareTermScheduleMap and everything will rerender again */
      setTempInfoObject(null);

    } catch (e) {
      setError(e as string);
      console.error(e);
    }
  }, [scheduleMap, schedules, profile, scheduleAssignments]);

  const scheduleOptions: Array<{ 
    label: string;
    customNode?: React.ReactNode;
    onClick: () => void;
  }> = useMemo(() => {
    if (!schedules) {
      return [];
    }

    return [
      'Select a schedule',
      ...schedules!,
      'Create a new schedule',
    ]!.map((schedule: ScheduleInfo | string) => {
      const isCreateNew = schedule === 'Create a new schedule';
      const isSelect = schedule === 'Select a schedule';
      return (
        ({
          label: isCreateNew || isSelect ? schedule : (schedule as ScheduleInfo).schedule_id!,
          customNode: isCreateNew ? (
            <div className="flex flex-row items-center gap-2">
              <AddIcon style={{ width: '20px', height: '20px' }}/>
              {schedule}
            </div> 
          ) : undefined,
          helper: isCreateNew,
          onClick: () => {
            if (!isCreateNew) {
              replaceScheduleAssignment(schedule);
            }
          }
        })
      );
    });
  }, [schedules, replaceScheduleAssignment]);

  const getOptions: (term: string) => Array<{ 
    label: string;
    onClick: () => void;
  }> = useCallback((term) => {
    return [
      { 
        label: 'Remove', 
        onClick: () => {
          handleUnselectTerm(term);
        }
      }
    ]; 
  }, []);

  return (
    <div 
      className="flex flex-col gap-2"
      onClick={() => {
        setTermSelected(term!);
      }}
    >
      <div className="flex flex-row gap-2 items-end">
        <h1 className="heading-sm">{term}</h1>
        <ActionDropdown
          options={getOptions(term)}
        />
        {isEditing && (
          <p className="text-sm text-gray-600 ">editing {schedule ? schedule.name! : ' an empty schedule'}...</p>
        )}
      </div>
      <div className="flex flex-row gap-8 w-full py-2 rounded rounded-lg">
        <ScheduleDropdown 
          options={scheduleOptions}
          text={schedule ? schedule.name! : 'Select a schedule'}
          selectedOption={schedule ? schedule.schedule_id! : 'Select a schedule'}
          createNewSchedule={createNewSchedule}
        />
        <div className="flex flex-row gap-4 items-center">
          <div className="flex flex-row gap-2 items-center">
            <NextToolTip content={nextToolTipDisplayContent} className="w-300">
              <InfoIcon style={{ width: '15px' }} />
            </NextToolTip>
            <p className="text-sm font-semi-bold">Schedule GPA</p>
          </div>
          {averageGpa && averageGpa !== 0 ? (
            <p className="text-sm font-semi-bold" style={{ color: formatGPA(averageGpa) }}>{Number(averageGpa).toFixed(2)}</p>
          ) : (
            <p className="text-gray-400 text-sm">N/A</p>
          )}
        </div>
        <div className="flex flex-row gap-4 items-center">
          <p className="text-sm font-semi-bold">Num Credits</p>
          {averageGpa && averageGpa !== 0 ? (
            <p className="text-sm">{Number(numCredits).toFixed()}</p>
          ) : (
            <p className="text-gray-400 text-sm">N/A</p>
          )}
        </div>
      </div>
      {/** Key is triggered upon input into search */}
      <Table 
        removeWrapper 
        aria-label="term-table" 
        className="w-full" 
        key={`${rerenderCount!}`}
        ref={tableRef}
      >
        <TableHeader columns={columns}>
        {(column) => (
          <TableColumn 
            className={column.width}
            key={column.key}
          >
            {column.label}
          </TableColumn>
        )}
        </TableHeader>
        <TableBody items={scheduleRows || []}>
          {(item) => (
            <TableRow 
              key={`${item.key}`} 
              className={`border-b border-gray-200 hover:bg-gray-100 ${item.key.startsWith('XX') ? '' : ''}`}
              onClick={() => {
                handleSelectRow(item.key);
              }}
            >
              {(columnKey) => {

                const value = getKeyValue(item, columnKey);
                const isEmptyRow = item.key.startsWith('XX');
                let course: Course | null = null;
                let averageGpa: number | null = null;
                if (activeResults.has(item.key) && activeResults.get(item.key)) {
                  course = courseMap?.get(activeResults.get(item.key)!)!; 
                  averageGpa = averagesMap?.get(activeResults.get(item.key)!)?.GPA!;
                }
                const isActive = item.key === activeKey;

                if (isEmptyRow) {
                  if (columnKey == 'course_id') {
                    return formatEmptyCourseID(item.key);
                  } else if (columnKey == 'course_name') {
                    return <TableCell className="text-gray-400">{course ? course.course_name : ''}</TableCell>;
                  } else if (columnKey == 'GPA') {
                    if (!averageGpa) {
                      return <TableCell>{''}</TableCell>;
                    }
                    let color = formatGPA(Number(averageGpa));
                    return (
                      <TableCell style={{ color: color }} className="font-loose">
                        {averageGpa.toFixed(2)}
                      </TableCell>
                    );
                  } else if (columnKey == 'num_credits') {
                    return <TableCell className="text-gray-400">{course ? course.credits : ''}</TableCell>;
                  } else if (columnKey == 'actions') {
                    return (
                      <TableCell>
                        <DeleteIcon 
                          style={{ width: '20px' }} 
                          className={`${isActive ? 'opacity-50 hover:opacity-100' : 'opacity-0'} hover:scale-110 `}
                          onClick={(e) => {
                            e.stopPropagation(); 
                            removeInsertedCourse(item.key);
                          }}
                        />
                      </TableCell>
                    );
                  }
                }

                course = courseMap?.get(item.key)!;
                averageGpa = averagesMap?.get(item.key)?.GPA!;

                if (columnKey === 'GPA') {
                  let color = formatGPA(Number(averageGpa));
                  return (
                    <TableCell style={{ color: color }} className="font-semibold">
                      {Number(averageGpa).toFixed(2)}
                    </TableCell>
                  );
                } else if (columnKey === 'course_id') {
                  return (
                    <TableCell>
                      <Link 
                        onClick={() => {
                          router.push(`/course?courseID=${value.toString()}`);
                        }}
                        className="text-sm hover:underline cursor-pointer"
                      >
                        {course.id}
                      </Link>
                    </TableCell>
                  );
                } else if (columnKey == 'course_name') {
                  return (
                    <TableCell className="text-sm">{course.course_name}</TableCell>
                  );
                } else if (columnKey == 'num_credits') {
                  return <TableCell className="text-sm">{course.credits}</TableCell>;
                } else {
                  return (
                    <TableCell>
                     {''} {/** Don't need to put anything here (just empty) */}
                    </TableCell>
                  );
                }
              }}
            </TableRow>
          )}
        </TableBody>
      </Table>
      <div className="flex flex-row justify-end gap-4 items-center">
        <p className="text-sm text-red-fe466c w-fit text-right opacity-90">{error}</p>
        {activeKey && (
          <div className={`flex flex-row items-center`}>
            <Link 
              className={`text-sm hover:underline cursor-pointer text-gray-500`}
              onClick={() => {
                removeInsertedCourse(activeKey!);
              }}
            >
              Delete
            </Link>
            <Kbd 
              keys={["command", "delete"]} 
              className="opacity-100 border-none shadow-none bg-transparent"
            />
          </div>
        )}
        <div className="flex flex-row items-center gap-2">
          <p className="text-sm text-gray-500">Select</p>
          <Kbd 
            onClick={incrementIndex}
            keys={["down"]} 
            className="opacity-100 border-none shadow-none bg-transparent cursor-pointer p-0 bg-none hover:bg-gray-200"
          />
          <Kbd 
            onClick={decrementIndex}
            keys={["up"]} 
            className="opacity-100 border-none shadow-none bg-transparent cursor-pointer p-0 hover:bg-gray-200"
          />
        </div>
        <div className="flex flex-row items-center">
          <Link 
            className="text-sm hover:underline cursor-pointer"
            onClick={() => {
              addEmptyRow();
            }}
          >
            Add row
          </Link>
          <Kbd 
            style={{ color: '#016fee' }} 
            keys={["command", "enter"]} 
            className="opacity-50 border-none shadow-none bg-transparent"
          />
        </div>
      </div>
    </div>
  );
}

export default TermTable;