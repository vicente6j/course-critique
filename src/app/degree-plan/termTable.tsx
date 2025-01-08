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
import { formatGPA, gradeColorDictHex } from "../shared/gradeTable";
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
import { useDegreePlanContext } from "../client-contexts/degreePlanContext";
import { useTermSelectionContext } from "../client-contexts/termSelectionContext";
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ActionDropdown from "../shared/actionDropdown";
import { createScheduleEntry, deleteScheduleEntry, updateScheduleEntry } from "../api/schedule-entries";
import { connect } from "http2";
import { POSSIBLE_GRADES } from "../metadata";
import { hexToRgba } from "../home/averageOverTime";

export interface TermTableColumn {
  key: string;
  label: string;
  width: string;
}

export const columns: TermTableColumn[] = [
  { key: "course_id", label: "Course ID", width: 'w-[20%]' },
  { key: "course_name", label: "Course Name", width: 'w-[35%]' },
  { key: "GPA", label: "Average GPA", width: 'w-[15%]' },
  { key: "num_credits", label: "Num Credits", width: 'w-[15%]' },
  { key: "grade", label: "Grade", width: 'w-[14%]' },
  { key: "actions", label: "", width: 'w-[1%]' },
];

export interface TermTableRow {
  key: string;
  [key: string]: number | string | boolean;
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

  /**
   * Maps each schedule key to a corresponding grade, INCLUDING empty ones. There can
   * be a grade for an empty row, even though it doesn't really make sense, it's fine.
   */
  const [gradeValues, setGradeValues] = useState<Map<string, string>>(new Map());
  
  /** E.g. CS 1332, for currently editing the grade for row with key CS 1332 */
  const [activeGradeKey, setActiveGradeKey] = useState<string | null>(null);
  const [previousGrade, setPreviousGrade] = useState<string | null>(null);
  const [showPrevious, setShowPrevious] = useState<boolean | null>(false);

  /** 
   * The purpose of having both activeKey and activeIndex is activeKey represents the key of
   * the row we're currently editing; this can be any value, even null. If we deselect a row,
   * the activeKey goes back to its default null state.
   * 
   * However, the active index can never be null; it represents which row to begin from
   * upon scrolling down or up with the arrow keys. i.e. activeKey represents an editing state,
   * activeIndex a location.
   */
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [activeCol, setActiveCol] = useState<number>(0);
  const [hoverRow, setHoverRow] = useState<string | null>(null);
  const [hoverGrade, setHoverGrade] = useState<string | null>(null);
  const [disablePointerEvents, setDisablePointerEvents] = useState<boolean>(false);

  const [schedule, setSchedule] = useState<ScheduleInfo | null>(null);

  const inputRefs = useRef<Map<string, MutableRef<HTMLInputElement>>>(new Map());
  const gradeInputRefs = useRef<Map<string, MutableRef<HTMLInputElement>>>(new Map());
  const tableRef = useRef<HTMLDivElement | null>(null);
  const initLoadComplete = useRef<boolean>(false);

  const { courses, courseMap, averagesMap } = useCourses();
  const { handleUnselectTerm } = useTermSelectionContext();
  
  const { 
    termScheduleMap, 
    termSelected, 
    setTermSelected, 
    replaceScheduleAssignment,
    tempInfoObject,
    setIsEditing, 
  } = useDegreePlanContext();

  const { 
    schedules, 
    scheduleMap, 
    scheduleEntryMap, 
    scheduleGradeMap,
    refetchScheduleEntries,
    loading: profileLoading
  } = useProfile();

  const router = useRouter();

  /** 
   * Runs every instance of activeKey or activeGradeKey, hoverRow,
   * or hoverGrade changing (extremely regularly -- needed to update the base
   * NextUI table). 
  */
  useEffect(() => {
    setRerenderCount(prev => prev! + 1);
  }, [activeKey, activeGradeKey, hoverRow, hoverGrade, showPrevious]);

  useEffect(() => {
    setIsEditing(
      (scheduleRows ? scheduleRows!.some(schedule => schedule.key.startsWith('XX')) : false)
        && activeKey !== null
    );
  }, [scheduleRows, activeKey]);

  /** 
   * On every rerender try to activate the
   * row indicated by 'activeKey' (if it's available).
   * Also try to activate the grade cell indicated by
   * 'activeGradeKey' (if it's available).
   */
  useEffect(() => {
    if (activeKey) {
      const inputRef = inputRefs.current.get(activeKey);
      if (inputRef?.current) {
        inputRef!.current.focus();
      }
    }
    if (activeGradeKey) {
      const gradeRef = gradeInputRefs.current.get(activeGradeKey);
      if (gradeRef?.current) {
        gradeRef!.current.focus();
      }
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

  const scheduleId: string | null = useMemo(() => {
    if (!termScheduleMap) {
      return null;
    }
    initLoadComplete.current = false; /** Make sure we can call fetch schedule entries and rerender everything 
    if the schedule ID changes */
    return termScheduleMap.get(term) || null;
  }, [termScheduleMap]);

  const fetchScheduleEntries: () => void = useCallback(() => {
    if (!scheduleEntryMap || profileLoading || initLoadComplete.current) {
      /**
       * Don't run this upon a few cases.
       * (a) scheduleEntryMap is null--hasn't been fetched yet.
       * (b) profile is still loading (this is essentially the same as above)
       * (c) The init load has happened, i.e. we're just modifying an existing schedule
       */
      return;
    } else if (!scheduleId || !scheduleEntryMap.has(scheduleId)) {
      /** No assignment exists */
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
        entry_id: entry.entry_id,
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

  const fetchScheduleGrades: () => void = useCallback(() => {
    if (!scheduleGradeMap || !scheduleRows || initLoadComplete.current) {
      return;
    } else if (!scheduleId || !scheduleGradeMap.has(scheduleId)!) {
      /** There is no grade listed for the given scheduleId, or there is no schedule at all */
      setGradeValues(new Map(scheduleRows.map(row => [row.key, ''])));
      initLoadComplete.current = true;
      return;
    }
    let gradeMap: Map<string, string> = new Map();
    for (const entry of scheduleGradeMap.get(scheduleId)!) {
      const courseId = scheduleRows.find(row => row.entry_id === entry.entry_id)!.key; /** Must exist, since each entry in scheduleGradeMap has a real entryId */
      gradeMap.set(courseId, entry.grade);
    }
    /** Add the null rows */
    for (const row of scheduleRows) {
      if (!gradeMap.has(row.key)) {
        gradeMap.set(row.key, '');
      }
    }
    initLoadComplete.current = true; /** Set init load complete at the end of schedule grades */
    setGradeValues(gradeMap);
  }, [scheduleId, scheduleGradeMap, scheduleRows]);

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
    fetchScheduleGrades();
    fetchSchedule();
  }, [fetchScheduleEntries, fetchScheduleGrades, fetchSchedule]);

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
   * is previously selected. Moreover,
   *  -- 1. Add an entry to query values to represent the string which the user is now querying
   *  -- 2. Add an entry to active results to represent the filtered suggestions as a result
   *    of the query
   */
  const handleSelectRow: (key: string, rows?: TermTableRow[]) => void = useCallback((key: string, rows?) => {
    if (!scheduleRows) {
      return;
    }

    if (activeGradeKey) {
      handleDeselectGrade();
    }

    let newRows: TermTableRow[] = rows 
      ? rows 
      : previousRow ? handleDeselect() 
      : scheduleRows;

    if (key.startsWith('XX')) {
      /** 
       * Here there's three cases. Either 
       *   (a) we're selecting an arbitrary empty row, in which case we simply have to activate it or 
       *   (b) we're deselecting a real row. We can catch this case by checking to see if 
       *     the previous row's key doesn't start with 'XX' or 
       *   (c) we're deselecting an active empty row (I hit the empty row twice), in which case
       *   we handle it the same as (b) and just return
       */

      if (previousRow && (!previousRow.key.startsWith('XX') || previousRow.key === key)) {
        return; /** Handled deselect case above */
      }
      /** Activate the empty row */
      setActiveKey(key);
      let index = newRows.findIndex(row => row.key === key);
      if (activeIndex !== index) {
        setActiveIndex(index);
      }
      setPreviousRow(newRows.find(row => row.key === key)!);
      return;
    }

    const paddedNumber = emptyIndex.toString().padStart(4, '0');
    setEmptyIndex(prev => prev + 1);
    let index = newRows.findIndex(row => row.key === key);
    let prevRow = newRows.find(row => row.key === key);
    setPreviousRow(prevRow!);

    if (activeIndex !== index) {
      setActiveIndex(index);
    }

    const newKey = `XX ${paddedNumber}`;
    newRows = [
      ...newRows.slice(0, index),
      { ...newRows[index], key: newKey }, /** Maintains old entry and hover state */
      ...newRows.slice(index + 1)
    ];

    setScheduleRows(newRows);
    setQueryValues(prev => {
      const newDict = new Map(prev);
      newDict.set(newKey, key);
      return newDict;
    });
    setActiveResults(prev => {
      const newDict = new Map(prev);
      newDict.set(newKey, key);
      return newDict;
    });
    setActiveKey(newKey);
  }, [emptyIndex, scheduleRows, rerenderCount, activeKey, previousRow, activeIndex, activeGradeKey]);

  /**
   * This function basically either 
   * (a) restores the original state of the table before selecting something.
   * e.g. I select a real row, then this function restores the row I selected
   * back into the table (no edit key).
   * (b) deselects an empty row, which is to say it sets active key to null
   * and returns.
   */
  const handleDeselect: () => TermTableRow[] = useCallback(() => {
    if (!activeKey || !previousRow) {
      return scheduleRows!;
    } 
    
    let newRows: TermTableRow[] = [];
    if (!previousRow!.key.startsWith('XX')) {
      /**
       * We're deselecting a real entry at this point.
       * Remove from all dictionaries and reset the scheduleRows using previousRow.
       */
      let index = scheduleRows!.findIndex(row => row.key === activeKey);
      newRows = [
        ...scheduleRows!.slice(0, index),
        { ...scheduleRows![index], key: previousRow!.key }, /** Maintains previous row hover state and entry */
        ...scheduleRows!.slice(index + 1)
      ];
      setScheduleRows(newRows);
      removeFromDictionaries(activeKey!);
    } else {
      newRows = scheduleRows!;
    }
    setPreviousRow(null);
    setActiveKey(null);

    return newRows;
  }, [activeKey, scheduleRows, previousRow]);

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

  const removeFromDictionaries: (key: string) => void = useCallback((key) => {
    setQueryValues(prev => {
      const newDict = new Map(prev);
      newDict.delete(key);
      return newDict;
    });
    setActiveResults(prev => {
      const newDict = new Map(prev);
      newDict.delete(key);
      return newDict;
    });
  }, []);

  /**
   * This handles the insertion of a course entry into either 
   *   a. an empty schedule
   *   b. a real schedule (scheduleId is non null). this thus requires
   *     pinging the back-end to add to the schedule and fetch that entry
   *     for updates
   * @param key the key of the row to create an entry for (begins with 'XX' always)
   */
  const addActiveCourse: (key: string) => Promise<void> = useCallback(async (key: string) => {
    if (!scheduleRows || !activeResults) {
      setError('Missing required data.');
      return;
    } else if (!activeResults.get(key)) {
      setError('Didn\'t find a course to add');
      return;
    }

    try {
      const courseId = activeResults.get(key)!;

      if (scheduleRows!.some(row => row.key === courseId)) {
        setError('You already added this course.');
        setRerenderCount(prev => prev! + 1); /** Activate the input ref again */
        return;
      }

      let newRows: TermTableRow[] = [];
      let isUpdate: boolean = false;
      if (previousRow && !previousRow.key.startsWith('XX')) {
        /** 
         * We have a real previous row we're replacing 
         * Assume that all real rows are greedily at the front of the list
        */
        newRows = [
          ...scheduleRows.slice(0, activeIndex),
          { key: courseId, course_id: courseId, entry_id: scheduleRows[activeIndex].entry_id, isHovering: false, isHoveringOnGrade: false },
          ...scheduleRows.slice(activeIndex + 1)
        ];
        isUpdate = true;
      } else {
        /** We're simply adding on an empty row */
        newRows = [
          ...scheduleRows!.filter(row => row.key !== key && !row.key.startsWith('XX')),
          { key: courseId, course_id: courseId, }, /** notice we don't have an entryId yet */
          ...scheduleRows!.filter(row => row.key !== key && row.key.startsWith('XX')) /** In some cases we may have multiple emtpy rows,
          which we want to carry over */
        ];
      }

      if (!newRows.some(row => row.key.startsWith('XX'))) { 
        newRows = addEmptyRow(newRows, true); /** Only add if we don't have an empty row */
      }

      setScheduleRows(newRows);
      removeFromDictionaries(key);

      /** At this point we definitely have an empty row (or multiple), so select the first one */
      const firstEmptyIndex = newRows.findIndex(row => row.key.startsWith('XX'));
      setActiveKey(newRows[firstEmptyIndex].key);
      setPreviousRow(newRows[firstEmptyIndex]);
      setRerenderCount(prev => prev! + 1);
      setActiveIndex(firstEmptyIndex);

      if (isUpdate && scheduleId) {
        let entryId: number = scheduleRows[activeIndex].entry_id as number;

        await updateScheduleEntry(schedule!.schedule_id, entryId, courseId);
        await refetchScheduleEntries();

      } else if (scheduleId) {

        await createScheduleEntry(schedule!.schedule_id, courseId);
        /** This doesn't retrigger new schedule entries since initLoadComplete.current will be set to true */
        const newEntries = await refetchScheduleEntries();

        /** 
         * It only remains to make sure we update the newRows with the right entry_id, so that we can delete it later. 
         * Note that here we don't actually trigger a rerender of the rows, since the objects remain the same.
        */
        setScheduleRows(prev => {
          const insertIndex = prev!.findIndex(row => row.key === courseId)!;
          const newArr = [
            ...prev!.slice(0, insertIndex), 
            { ...prev![insertIndex], entry_id: newEntries?.find(row => row.course_id === courseId)!.entry_id!},
            ...prev!.slice(insertIndex + 1)
          ];
          return newArr!;
        })
      }
    } catch (error) {
      console.error(error);
      setError('Unable to insert into schedule');
    }
  }, [activeResults, scheduleRows, activeIndex]);

  const removeInsertedCourse: (key: string) => Promise<void> = useCallback(async (key) => {
    try {
      const newRows = [...scheduleRows!.filter(row => row.key !== key)];
      setScheduleRows(newRows);

      let deletedIndex = scheduleRows!.findIndex(row => row.key === activeKey);

      if (newRows.length > 0) {
        handleSelectRow(
          deletedIndex === 0 
            ? newRows[deletedIndex].key 
            : newRows[deletedIndex - 1].key, 
          newRows
        );
        setActiveIndex(
          deletedIndex === 0 ? deletedIndex : deletedIndex - 1
        );
      } else {
        setPreviousRow(null);
        setActiveKey(null);
        setActiveIndex(-1);
      }
      removeFromDictionaries(key);

      if (!previousRow!.key.startsWith('XX') && schedule) {
        await deleteScheduleEntry(schedule.schedule_id, Number(previousRow!.entry_id!));
        await refetchScheduleEntries();
      }
    } catch (error) {
      console.error(error);
      setError('Unable to remove from schedule');
    }
  }, [scheduleRows, previousRow, activeKey]);

  /**
   * Adds an empty row to scheduled rows (based on the current empty index to avoid collisions).
   * Optional param to pass in a collection of rows to filter. Optional param to return the 
   * rows rather than set scheduleRows.
   * @param rows optional rows to filter
   * @param returnList optional param to return rather than set
   */
  const addEmptyRow: (rows?: TermTableRow[], returnList?: boolean) => TermTableRow[] = useCallback((rows?, returnList?) => {
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
    let index = scheduleRows!.findIndex(row => row.key === activeKey);
    /** 
     * 1. If myRows is empty, just add the empty row and continue.
     * 2. If the current row selected is a real course (and potentially has real courses underneath it), 
     *    just add the empty row underneath all the non empty ones. 
     *    Otherwise, add the empty row directly underneath our current row.
     */
    const emptyRow: TermTableRow = { key: key, course_id: key };
    if (myRows.length === 0) {
      newRows = [emptyRow];
    } else if (index < 0 || index >= myRows.length || !myRows[index].key.startsWith('XX')) {
      newRows = [ 
        ...myRows.filter(row => !row.key.startsWith('XX')), 
        emptyRow, /** add it right underneath the real rows, even if there are other empty rows */
        ...myRows.filter(row => row.key.startsWith('XX')) /** rest of the empty rows */
      ];
    } else {
      newRows = [
        ...myRows.slice(0, index + 1), /** use this filter to capture empty rows potentially above our current row */
        emptyRow, /** finally, add the empty row */
        ...myRows.slice(index + 1)
      ];
    }
    if (returnList) {
      return newRows;
    }
    setScheduleRows(newRows);
    setActiveKey(key);
    setPreviousRow(newRows.find(row => row.key === key)!);
    
    /** Purpose of this is depending on where we put the empty row, that's where our new index is */
    setActiveIndex(newRows.findIndex(row => row.key === key)!);
    return newRows;
  }, [emptyIndex, scheduleRows, activeKey]);

  /**
   * Handles search value changing. Plus, manually retriggers a rerender in the case that
   * the key is the same (most of the time).
   * @param value value which is queried
   * @param key key of the row which is queried on
   */
  const onSearchChange: (value: string, key: string) => void = useCallback((value, key) => {
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
    setRerenderCount(prev => prev! + 1); /** Manually rerender since key isn't changing */
  }, [filterCourses]);

  const handleSelectGrade: (key: string) => void = useCallback((key) => {
    if (activeGradeKey && activeGradeKey === key) { 
      handleDeselectGrade();
      return;
    } 
    if (activeKey) {
      handleDeselect();
      key = previousRow!.key;
    }

    if (gradeValues.get(key)!.length > 0) {
      setPreviousGrade(gradeValues.get(key)!);
    }
    setActiveGradeKey(key);

    /** Suggested grade at this point should be null. */
  }, [gradeValues, activeGradeKey, activeKey, handleDeselect, previousRow]);

  const handleDeselectGrade: () => void = useCallback(() => {
    if (!activeGradeKey) {
      return;
    } 
    /** Reset the entry grade map */
    if (previousGrade) {
      setGradeValues(prev => {
        const newDict = new Map(prev);
        newDict.set(activeGradeKey!, previousGrade);
        return newDict;
      });
    }
    setPreviousGrade(null);
    setActiveGradeKey(null);
  }, [activeGradeKey, previousGrade]);

  /**
   * Handles grade value changing.
   * @param value value which is queried
   * @param key the key which is used
   */
  const onGradeChange: (value: string, key: string) => void = useCallback((value, key) => {
    value = value.toUpperCase();
    if (!POSSIBLE_GRADES.some(el => el === value) && value !== '') {
      setError('Must insert a valid grade (A, B, C, D, F, W)');
      return;
    }
    setGradeValues(prev => {
      const newDict = new Map(prev);
      newDict.set(key, value);
      return newDict;
    });
    if (value !== '') {
      setPreviousGrade(null);
      setActiveGradeKey(null);
    }
    setRerenderCount(prev => prev! + 1); /** Manually rerender since key isn't changing */
  }, []);

  type KeyDownType = 'course' | 'grade';
  const handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>, key: string, type: KeyDownType) => void = useCallback((e, key, type) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && termSelected === term) {
      /** Handles case of inserting rows with cmd-enter (don't do anything) */
      return;
    }
    switch (e.key) {
      case 'Enter':
        if (type === 'course') {
          /** Treat this enter command like inserting a course */
          if (!activeResults.get(key) || activeResults.get(key)!.length === 0) {
            return;
          }
          addActiveCourse(key);
          const inputRef = inputRefs.current.get(key);
          if (inputRef?.current) {
            inputRef.current.blur();
          }
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

  const incrementIndex: () => void = useCallback(() => {
    if (!scheduleRows) {
      return;
    }
    let newIndex = Math.min(activeIndex + 1, scheduleRows.length);
    if (newIndex !== scheduleRows.length) {
      handleSelectRow(scheduleRows[newIndex].key);
    } else {
      handleDeselect();
    }
    setActiveIndex(newIndex);
    setHoverRow(null); /** Prevent the user from hovering immediately after */
    setDisablePointerEvents(true);
  }, [activeKey, scheduleRows, activeIndex]);

  const decrementIndex: () => void = useCallback(() => {
    if (!scheduleRows) {
      return;
    }
    let newIndex = Math.max(activeIndex -1, -1);
    if (newIndex !== -1) {
      handleSelectRow(scheduleRows[newIndex].key);
    } else {
      handleDeselect();
    }
    setActiveIndex(newIndex);
    setHoverRow(null);
    setDisablePointerEvents(true);
  }, [activeKey, scheduleRows]);

  const handleShortcuts: (e: KeyboardEvent) => void = useCallback((e: KeyboardEvent) => {
    const metaKey = e.metaKey || e.ctrlKey;
    const correctTerm = termSelected === term;

    if (metaKey && e.key === 'Enter' && correctTerm) {
      addEmptyRow();
    } else if (e.key === 'ArrowDown' && correctTerm) {
      incrementIndex();
    } else if (e.key === 'ArrowUp' && correctTerm) {
      decrementIndex();
    } else if (metaKey && e.key === 'Backspace' && correctTerm && activeKey && !activeGradeKey) {
      removeInsertedCourse(activeKey);
    } else if (activeGradeKey) {
      /** Want to show the previous grade */
      setShowPrevious(metaKey);
      if (e.key === 'Backspace') {
        setPreviousGrade(null); /** Remove it */
      }
    } 
  }, [activeKey, termSelected, activeGradeKey]);

  const handleClickOutside: (event: MouseEvent) => void = useCallback((event) => {
    if (tableRef && !tableRef.current!.contains(event.target as Node) && termSelected === term) {
      handleDeselect();
      handleDeselectGrade();
    }
  }, [termSelected, tableRef, handleDeselect, handleDeselectGrade]);

  useEffect(() => {
    /**
     * For the case of deselecting command on a grade cell (release previous grade).
     * @param e keyboard event
     */
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Meta' || e.key === 'Control') {
        setShowPrevious(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleShortcuts);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleShortcuts);
      window.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handleShortcuts, handleClickOutside]);

  useEffect(() => {
    /**
     * Allows users to reenable pointer events after moving the cursor (helps eliminate flickering).
     */
    const handleMouseMove = () => {
      if (disablePointerEvents) {
        setDisablePointerEvents(false);
        setRerenderCount(prev => prev! + 1);
      }
    };
  
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [disablePointerEvents]);

  const averageGpa: number | null = useMemo(() => {
    if (!scheduleRows || !averagesMap) {
      return null;
    }
    let average = 0;
    let credits = 0;
    for (const row of scheduleRows) {
      if (row.key.startsWith('XX') || !averagesMap.has(row.key)) {
        continue;
      }
      const courseGpa = averagesMap.get(row.key)!.GPA!;
      const numCredits = Number(courseMap!.get(row.key)!.credits!);
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

  const formatEmptyCourseID: (item: TermTableRow) => JSX.Element = useCallback((item) => {
    const inActiveResults = activeResults.has(item.key) && activeResults.get(item.key);
    const inQueryValues = queryValues.has(item.key) && queryValues.get(item.key)!.length > 0;
    const shouldBeHighlighted = item.key === hoverRow || item.key === activeKey;
    return (
      <TableCell
        className={`text-sm ${shouldBeHighlighted && 'bg-gray-100'}`}
        onClick={() => handleSelectRow(item.key)}
        onMouseEnter={() => setHoverRow(item.key)}
        onMouseLeave={() => setHoverRow(null)}
      >
        <div className="relative rounded-lg max-h-xs rounded-none border-b border-gray-400 py-1 pr-1 z-10">
          <div className="absolute text-search bg-transparent outline-none !cursor-text !z-10">
            {/** Use uppercase here on all formatting */}
            {inActiveResults ? (
              <>
                {/**
                 * This achieves the effect of putting a 'suggestion' in front of what you type
                 * (first span is for spacing, second span is for autofill).
                 */}
                <span className="opacity-0">
                  {activeResults.get(item.key)?.slice(0, queryValues.get(item.key)!.length).toUpperCase()}
                </span>
                <span className="text-gray-400">
                  {activeResults.get(item.key)!.slice(queryValues.get(item.key)!.length).toUpperCase()}
                </span>
              </>
            ) : (
              <>
                {/** Placeholder text which can't actually be modified */}
                <span className="text-gray-400">
                  {inQueryValues ? '' : '+XX 0000'}
                </span>
              </>
            )}
          </div>
          <div className="flex flex-row gap-0 items-center">
            {/** onFocus=(stop propagation) needed to prevent row from being selected */}
            <input
              id={`searchbar-${item.key}`}
              type="text"
              ref={(el) => {
                if (el) {
                  {/** This gets updated on each render, but it's fine (don't check if the map contains it) */}
                  inputRefs.current.set(item.key, { current: el });
                }
              }}
              value={queryValues.get(item.key)?.toUpperCase()}
              onChange={(e) => onSearchChange(e.target.value, item.key)}
              onFocus={(e) => e.stopPropagation()}
              onKeyDown={(e) => handleKeyDown(e, item.key, 'course')}
              placeholder=""
              className={`text-search bg-transparent z-2 outline-none w-80`}
            />
          </div>
        </div>
      </TableCell>
    );
  }, [activeResults, queryValues, rerenderCount, inputRefs, activeKey]);

  const formatGradeInput: (item: TermTableRow) => JSX.Element = useCallback((item) => {
    const key = item.key;
    return (
      <TableCell
        className={`
          border-b border-gray-200 text-sm 
          ${(item.key === hoverGrade || activeGradeKey === item.key) && 'bg-gray-100'}
        `}
        onClick={() => handleSelectGrade(item.key)}
        onMouseEnter={() => setHoverGrade(item.key)}
        onMouseLeave={() => setHoverGrade(null)}
      >
        <div className="relative w-fit border-b border-gray-400 py-1 pr-2 z-10">
          <div className="absolute text-search bg-transparent outline-none !cursor-text !z-10">
            {/** 
             * Placeholder text which can't actually be modified.
             * Note that it DOES NOT MATTER whether the user has typed something in the grade
             * field before; no matter what, we arbitrarily display this +X symbol to indicate
             * that something should be typed to continue (or just deselect).
             * This means that we don't actually display the value which lives in gradeValues
             * if there is one.
             */}
            {(!showPrevious || !previousGrade || activeGradeKey !== item.key) && (
              <span className="text-gray-400">
                {'+X'}
              </span>
            )}
          </div>
          {/** Input field is necessary here in order to properly give border to div */}
          <div className="flex flex-row gap-0 items-center">
            {/** onFocus=(stop propagation) needed to prevent row from being selected */}
            <input
              id={`searchbar-${key}`}
              type="text"
              ref={(el) => {
                if (el) {
                  gradeInputRefs.current.set(key, { current: el });
                }
              }}
              value={showPrevious && previousGrade && activeGradeKey === item.key ? previousGrade : ''} /** Only display if cmd is pressed */
              onChange={(e) => onGradeChange(e.target.value, key)}
              onFocus={(e) => e.stopPropagation()}
              onKeyDown={(e) => handleKeyDown(e, key, 'grade')}
              placeholder=""
              className={`text-search bg-transparent z-2 outline-none w-5`}
            />
          </div>
        </div>
      </TableCell>
    );
  }, [gradeInputRefs, hoverGrade, showPrevious, previousGrade, activeGradeKey]);

  const nextToolTipDisplayContent: JSX.Element = useMemo(() => {
    if (!scheduleRows || !averagesMap) {
      return <></>;
    }
    const nonEmptyAndNonNan = scheduleRows.filter(row => !row.key.startsWith('XX') && averagesMap!.has(row.key));
    const numItems = nonEmptyAndNonNan.length;
    return (
      <p>
        {`Weighted by number of credits for each class. ${numItems !== 0 ? (
          `The value ${Number(averageGpa).toFixed(2)} is currently averaging 
            ${nonEmptyAndNonNan.map((row => {
              return ` ${row.key}`
            }))} (${numItems} items)`
        ) : (
          ''
        )}`}
      </p>
    )
  }, [scheduleRows, averageGpa, averagesMap])

  const scheduleOptions: Array<{ 
    label: string;
    customNode?: React.ReactNode;
    onClick: () => void;
  }> = useMemo(() => {
    if (!schedules) {
      return [];
    }

    return [
      'Create a new schedule',
      'Select a schedule',
      ...schedules!,
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

  useEffect(() => {
    if (hoverRow) {
      setHoverGrade(null);
    }
    if (hoverGrade) {
      setHoverRow(null);
    }
  }, [hoverRow, hoverGrade]);

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
      </div>
      <div className="flex flex-row gap-8 w-full py-2 rounded rounded-lg">
        <ScheduleDropdown 
          options={scheduleOptions}
          text={schedule ? schedule.name! : 'Select a schedule'}
          selectedOption={schedule ? schedule.schedule_id! : 'Select a schedule'}
          term={term}
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
        {(column) => {
          return (
            <TableColumn 
              className={`${column.width} ${column.key === 'actions' && 'bg-transparent'}`}
              key={column.key}
            >
              {column.label}
            </TableColumn>
          );
        }}
        </TableHeader>
        <TableBody items={scheduleRows || []}>
          {(item) => {
            return (
              <TableRow 
                key={`${item.key} ${hoverRow}`} 
              >
                {(columnKey) => {

                  const value = getKeyValue(item, columnKey);
                  const isEmptyOrEditing = item.key.startsWith('XX');

                  let hasGradeValue: boolean = false;
                  let grade: string | null = null;
                  if (!isEmptyOrEditing) {
                    hasGradeValue = gradeValues.has(item.key) && gradeValues.get(item.key)!.length > 0;
                    grade = gradeValues.get(item.key)!;
                  } else {
                    hasGradeValue = previousRow && gradeValues.has(previousRow!.key) && gradeValues.get(previousRow!.key)!.length > 0 || false;
                    if (hasGradeValue) {
                      grade = gradeValues.get(previousRow!.key)!;
                    }
                  }

                  let course: Course | null = null;
                  let averageGpa: number | string | null = null;
                  /**
                   * Every row will necessarily have either
                   *  (a) an entry in activeResults (e.g. XX 0000 -> CS 1332)
                   *   or (b) a real course ID key (e.g. just CS 1332)
                   *   or (c) neither (if it's completely new and empty)
                   */
                  if (activeResults.has(item.key) && activeResults.get(item.key)) {
                    course = courseMap?.get(activeResults.get(item.key)!)!; 
                    averageGpa = averagesMap?.get(activeResults.get(item.key)!)?.GPA! || 'N/A';
                  } else if (!isEmptyOrEditing) {
                    course = courseMap?.get(item.key)!;
                    averageGpa = averagesMap?.get(item.key)?.GPA || 'N/A';
                  }
                  const isActive = item.key === activeKey;
                  /** 
                   * Hover row indicates where the cursor currently is, but we should also be able
                   * to highlight a row based on whetehr it's currently active.
                   */
                  const shouldBeHighlighted = isActive || hoverRow === item.key;

                  if (columnKey === 'course_id') {
                    return isEmptyOrEditing 
                      ? formatEmptyCourseID(item)
                      : (
                        <TableCell
                          className={`
                            ${shouldBeHighlighted && 'bg-gray-100'} 
                            border-b border-gray-200
                            ${disablePointerEvents && 'pointer-events-none'}
                          `}
                          onClick={() => handleSelectRow(item.key)}
                          onMouseEnter={() => setHoverRow(item.key)}
                          onMouseLeave={() => setHoverRow(null)}
                        >
                          <Link 
                            onClick={() => {
                              router.push(`/course?courseID=${value.toString()}`);
                            }}
                            className={`text-sm hover:underline cursor-pointer`}
                          >
                            {course!.id}
                          </Link>
                        </TableCell>
                      );
                  } else if (columnKey === 'course_name') {
                    return (
                      <TableCell 
                        className={`
                          text-sm border-b border-gray-200 
                          ${shouldBeHighlighted && 'bg-gray-100'}
                          ${disablePointerEvents && 'pointer-events-none'}
                        `}
                        onClick={() => handleSelectRow(item.key)}
                        onMouseEnter={() => setHoverRow(item.key)}
                        onMouseLeave={() => setHoverRow(null)}
                      >
                        {course ? course.course_name : ''}
                      </TableCell>
                    );
                  } else if (columnKey === 'GPA') {
                    const isNA = averageGpa === 'N/A';
                    const color = isNA || !averageGpa ? 'gray' : formatGPA(Number(averageGpa));
                    return (
                      <TableCell 
                        style={{ color: color }} 
                        className={`
                          font-semibold border-b border-gray-200 
                          ${shouldBeHighlighted && 'bg-gray-100'}
                          ${disablePointerEvents && 'pointer-events-none'}
                        `}
                        onClick={() => handleSelectRow(item.key)}
                        onMouseEnter={() => setHoverRow(item.key)}
                        onMouseLeave={() => setHoverRow(null)}
                      >
                        {isNA ? 'N/A' : !averageGpa ? '' : Number(averageGpa).toFixed(2)}
                      </TableCell>
                    );
                  } else if (columnKey === 'num_credits') {
                    return (
                      <TableCell 
                        className={`
                          text-sm border-b border-r border-gray-200 
                          ${shouldBeHighlighted && 'bg-gray-100'}
                          ${disablePointerEvents && 'pointer-events-none'}
                        `}
                        onClick={() => handleSelectRow(item.key)}
                        onMouseEnter={() => setHoverRow(item.key)}
                        onMouseLeave={() => setHoverRow(null)}
                      >
                        {course ? course.credits : ''}
                      </TableCell>
                    );
                  } else if (columnKey === 'grade') {
                    return hasGradeValue && activeGradeKey !== item.key ? (
                      /** 
                       * Two things have to be true in order to display this simple table cell.
                       * Firstly, there has to be a real grade value for the row. e.g.
                       *   - CS 1332 -> A is an entry.
                       * Secondly, if there's an active grade key (upon selecting a grade cell),
                       * it must not equal this row. i.e. this is a row which hasn't been selected
                       * and which has a real grade.
                       */
                      <TableCell
                        className={`
                          ${(item.key === hoverGrade || activeGradeKey === item.key) && 'bg-gray-100'} 
                          ${disablePointerEvents && 'pointer-events-none'}
                          border-b border-gray-200`
                        }
                        onClick={() => handleSelectGrade(item.key)}
                        onMouseEnter={() => setHoverGrade(item.key)}
                        onMouseLeave={() => setHoverGrade(null)}
                      >
                        {grade}
                      </TableCell>
                    ) : formatGradeInput(item); /** Otherwise, handle empty action */
                  } else if (columnKey === 'actions') {
                    return isEmptyOrEditing ? (
                      <TableCell>
                        <DeleteIcon 
                          style={{ width: '20px' }} 
                          className={`${isActive ? 'opacity-50 hover:opacity-100' : 'opacity-0'} hover:scale-110 cursor-pointer`}
                          onClick={(e) => {
                            e.stopPropagation(); 
                            removeInsertedCourse(item.key);
                          }}
                        />
                      </TableCell>
                    ) : (
                      <TableCell
                        className="invisible p-0"
                      >
                        {''}
                      </TableCell>
                    );
                  } else {
                    return (
                      <TableCell>
                        {''}
                      </TableCell>
                    );
                  }
                }}
              </TableRow>
            );
          }}
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
          <div className="flex gap-1">
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