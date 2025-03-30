'use client'
import { FC, useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { useCourses } from "../contexts/server/course/provider";
import { ScheduleEntry } from "../api/schedule-entries";
import { POSSIBLE_GRADES } from "../metadata";
import TermTableDropdown from "./termTableDropdown";
import { ScheduleInfo } from "../api/schedule";
import { GradeCourseType } from "../globalTypes";
import KeyboardReturnIcon from '@mui/icons-material/KeyboardReturn';
import { useDegreePlanContext } from "../hooks/degreePlan/degreePlanContext";
import { useSchedulesContext } from "../hooks/schedules/schedulesContext";
import { useScheduleEntriesContext } from "../hooks/scheduleEntries/scheduleEntriesContext";
import { useScheduleGradesContext } from "../hooks/scheduleGrades/scheduleGradesContext";
import { ScheduleGrade } from "../api/schedule-grades";
import ScheduleDropdown from "../shared/scheduleDropdown";

export interface TermTableColumn {
  key: string;
  label: string;
  width: string;
}

export const columns: TermTableColumn[] = [
  { key: "course_id", label: "Course ID", width: 'w-[20%]' },
  { key: "course_name", label: "Course Name", width: 'w-[30%]' },
  { key: "GPA", label: "Average GPA", width: 'w-[20%]' },
  { key: "num_credits", label: "Num Credits", width: 'w-[15%]' },
  { key: "grade", label: "Grade", width: 'w-[15%]' },
  { key: "actions", label: "", width: 'w-0' },
];

export interface TermTableRow {
  key: string;
  [key: string]: number | string | boolean;
}

export interface MutableRef<T> {
  current: T | null;
}

export interface TermTableProps {
  term: string;
}

export type Course = CourseInfo | null;

const TermTable: FC<TermTableProps> = ({
  term
}: TermTableProps) => {
  
  /**
   * Allows for unique term table row IDs assuming multiple
   * empty rows exist, e.g. 'XX 0000', 'XX 0001', ...
   */
  const [emptyIndex, setEmptyIndex] = useState<number>(1);

  /**
   * Although schedule entries under useScheduleEntries()
   * already has most of these rows, for the purpose of displaying updated
   * rows & empty rows in the client format (course ID, course name, GPA...), use this.
   */
  const [scheduleRows, setScheduleRows] = useState<TermTableRow[] | null>(null);

  /**
   * Each term table row has a search field where the user can type in a course.
   * Use this dictionary to map term table row keys and the associated search 
   * query which currently lives there (most will be empty).
   */
  const [queryValues, setQueryValues] = useState<Map<string, string>>(new Map());

  /** 
   * Use active results dictionary to store the currently active result for any search
   * query, e.g. 
   * 'CS 1' might result in
   * XX 0000 -> CS 13332
   * as the result which appears. 
   */
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
  
  /** 
   * E.g. CS 1332, for currently editing the grade for row with key CS 1332.
   * Used to keep track of which row is currently editing a grade.
   */
  const [activeGradeKey, setActiveGradeKey] = useState<string | null>(null);
  const [previousGrade, setPreviousGrade] = useState<string | null>(null);

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

  /**
   * Discriminate between editing a course or grade.
   */
  const [activeCol, setActiveCol] = useState<number>(0);

  /**
   * Both hover row and hover grade keep track of which element on the client is currently
   * being hovered on. The purpose of keeping this in a React field rather than simply using
   * onMouseEnter or onMouseLeave, which is prone to bugs--especially when adding or deleting
   * table rows and your cursor lands on a different object without moving.
   */
  const [hoverRow, setHoverRow] = useState<string | null>(null);
  const [hoverGrade, setHoverGrade] = useState<string | null>(null);

  /**
   * Used for when we add a row or delete a row from the term table; without disabling pointer events
   * (and hovers), adding entries will automatically hover on the next field, making deducing which
   * entry you're actually editing more difficult.
   */
  const [disablePointerEvents, setDisablePointerEvents] = useState<boolean>(false);

  /**
   * State to capture whether an input field should change if backspace was entered
   * (shortcut bug).
   */
  const [noChange, setNoChange] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean | null>(false);
  const [hoverDelete, setHoverDelete] = useState<boolean | null>(false);

  const inputRefs = useRef<Map<string, MutableRef<HTMLInputElement>>>(new Map());
  const gradeInputRefs = useRef<Map<string, MutableRef<HTMLInputElement>>>(new Map());
  const tableRef = useRef<HTMLDivElement | null>(null);
  const initLoadComplete = useRef<boolean>(false);
  const initLoadGradesComplete = useRef<boolean>(false);

  const { 
    data: courseData,
    maps: courseMaps
  } = useCourses();

  const {
    termScheduleMap,
    termSelected,
    handlers: degreePlanHandlers
  } = useDegreePlanContext();

  const {
    scheduleMap
  } = useSchedulesContext();

  const {
    entryMap,
    handlers: entryHandlers
  } = useScheduleEntriesContext();

  const {
    gradeMap,
    handlers: gradeHandlers
  } = useScheduleGradesContext();

  const router = useRouter();

  const scheduleId: string | null = useMemo(() => {
    if (!termScheduleMap || !termScheduleMap.has(term)) {
      return null;
    }
    return termScheduleMap.get(term) || null;
  }, [termScheduleMap]);

  const schedule: ScheduleInfo | null = useMemo(() => {
    if (!scheduleMap || !scheduleId) {
      return null;
    }
    return scheduleMap.get(scheduleId)!;
  }, [scheduleMap, scheduleId])

  const scheduleEntries: ScheduleEntry[] = useMemo(() => {
    if (!entryMap || !scheduleId) {
      return [];
    }
    return entryMap.get(scheduleId) || [];
  }, [entryMap, scheduleId]);

  const scheduleGrades: ScheduleGrade[] = useMemo(() => {
    if (!gradeMap || !scheduleId || !gradeMap.has(scheduleId)) {
      return [];
    }
    return gradeMap.get(scheduleId)!.get(term) || [];
  }, [gradeMap, scheduleId]);

  /** 
   * Runs every instance of activeKey, activeGradeKey, hoverRow,
   * or hoverGrade changing (extremely regularly).
   * 
   * This is needed to update the base NextUI table, since simply adding or deleting
   * entries to the table won't automatically rerender it.
   * 
   * Rerender count is the key for the entire DOM element. 
  */
  useEffect(() => {
    setRerenderCount(prev => prev! + 1);
  }, [activeKey, activeGradeKey, hoverRow, hoverGrade, hoverDelete]);

  /** 
   * On every rerender try to activate the row indicated by 'activeKey' (if it's available).
   * Also try to activate the grade cell indicated by 'activeGradeKey' (if it's available).
   * 
   * i.e. keep the input fields active and hydrated.
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

  /** 
   * Simple error display mechanism.
   */
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    const isEditing = (scheduleRows && scheduleRows!.some(schedule => schedule.key.startsWith('XX'))) && activeKey !== null;
    setIsEditing(isEditing);
  }, [scheduleRows, activeKey]);

  /**
   * Use this function to declare the base schedule rows off
   * of the obtained schedule entries in useScheduleEntries().
   */
  const declareScheduleRows: () => void = useCallback(() => {
    if (scheduleEntries.length === 0 && !initLoadComplete.current) {
      /**
       * Either no assignment exists, or the assignment which does exist
       * has no entries associated with the inputted schedule.
       */
      const emptyRow = { key: 'XX 0000', course_id: 'XX 0000' };
      setScheduleRows([emptyRow]);
      initLoadComplete.current = true;
      return;
    } else if (!initLoadComplete.current) {
      setScheduleRows(
        scheduleEntries.map(entry => ({
          key: entry.course_id!,
          course_id: entry.course_id!,
          entry_id: entry.entry_id,
        }))
      );
      initLoadComplete.current = true;
    }
  }, [scheduleEntries, initLoadComplete.current]);

  const declareScheduleGrades: () => void = useCallback(() => {
    if (!scheduleRows) {
      return;
    } else if (scheduleGrades.length === 0 && !initLoadGradesComplete.current) {
      setGradeValues(
        new Map(scheduleRows?.map(row => [row.key, '']))
      );
      initLoadGradesComplete.current = true;
      return;
    } else if (!initLoadGradesComplete.current) {
      setGradeValues(
        new Map(scheduleRows?.map(row => {
          const rowGrade = scheduleGrades.find(grade => grade.entry_id === row.entry_id) || null;
          return [row.key, rowGrade ? rowGrade.grade : ''];
        }))
      );
      initLoadGradesComplete.current = true;
      setRerenderCount(prev => prev! + 1);
    }
  }, [scheduleGrades, scheduleRows, initLoadGradesComplete.current]);

  /**
   * The sole purpose of this useEffect is to only run upon initialization.
   */
  useEffect(() => {
    if (!initLoadComplete.current) {
      declareScheduleRows();
    } else if (!initLoadGradesComplete.current) {
      declareScheduleGrades();
    }
  }, [declareScheduleRows, declareScheduleGrades, initLoadComplete.current, initLoadGradesComplete.current]);

  /**
   * This function has a few moving parts to it.
   * 
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
   * In this case, we definitely want to add the updated edit row to our scheduleRows, and we 
   * definitely want to deselect in the case that something is previously selected. Moreover,
   *  -- 1. Add an entry to query values to represent the string which the user is now querying
   *  -- 2. Add an entry to active results to represent the filtered suggestions as a result
   *    of the query
   * @param key The key of the row being selected
   * @param rows An optional parameter use passed in rows rather than state field (cascading hooks)
   */
  const handleSelectRow: (
    key: string, 
    rows?: TermTableRow[] 
  ) => void = useCallback((key, rows?) => {
    if (!scheduleRows && !rows) {
      return;
    }
    
    if (activeGradeKey) {
      handleDeselectGrade();
    }
    const prevRows: TermTableRow[] | null = rows ? rows : previousRow ? handleDeselect() : scheduleRows;
    if (!prevRows) {
      return;
    }

    setActiveCol(0);
    if (key.startsWith('XX')) {
      /** 
       * Here there's three cases. Either 
       *   (a) we're selecting an arbitrary empty row, in which case we simply have to activate it 
       *   (b) we're deselecting a real row. We can catch this case by checking to see if key === activeKey
       *   (c) we're deselecting an active empty row (hit the empty row twice), in which case
       *   we handle it the same as (b) and just return
       */
      if (previousRow && (previousRow.key === key || key === activeKey)) {
        setHoverRow(previousRow.key); /** Prevents flickering */
        return;
      }
      /** Activate the empty row */
      setActiveKey(key);
      const index = prevRows.findIndex(row => row.key === key);
      setActiveIndex(index);
      setPreviousRow(prevRows.find(row => row.key === key)!);
    } else {

      /** Selecting a real row with a real entry. */
      const paddedNumber = emptyIndex.toString().padStart(4, '0');
      setEmptyIndex(prev => prev + 1);
      const index = prevRows.findIndex(row => row.key === key);
      setActiveIndex(index);
      const prevRow = prevRows.find(row => row.key === key);
      setPreviousRow(prevRow!);

      const newKey = `XX ${paddedNumber}`;
      const newRows = [
        ...prevRows.slice(0, index),
        { ...prevRows[index], key: newKey }, /** Maintains old entry and hover state */
        ...prevRows.slice(index + 1)
      ];
      setScheduleRows(newRows);
      setQueryValues(prev => new Map(prev).set(newKey, key));
      setActiveResults(prev => new Map(prev).set(newKey, key));
      setActiveKey(newKey);
    }
  }, [emptyIndex, scheduleRows, activeKey, previousRow, activeGradeKey]);

  /**
   * This function either 
   * (a) restores the original state of the table before selecting something.
   * e.g. I select a real row, then this function restores the row I selected
   * back into the table (no edit key).
   * (b) deselects an empty row, which is to say it sets active key to null
   * and returns.
   */
  const handleDeselect: () => TermTableRow[] = useCallback(() => {
    if (!activeKey || !previousRow) {
      return scheduleRows || [];
    }
    
    let newRows: TermTableRow[] = [];
    if (!previousRow.key.startsWith('XX')) {
      /**
       * We're deselecting a real entry at this point.
       * Remove from all dictionaries and reset the scheduleRows using previousRow.
       */
      const remindex = scheduleRows!.findIndex(row => row.key === activeKey);
      newRows = [
        ...scheduleRows!.slice(0, remindex),
        { ...scheduleRows![remindex], key: previousRow!.key },
        ...scheduleRows!.slice(remindex + 1)
      ];
      setScheduleRows(newRows);
      removeFromQueryDictionaries(activeKey!);
    } else {
      newRows = scheduleRows!;
    }
    setPreviousRow(null);
    setActiveKey(null);

    return newRows;
  }, [activeKey, scheduleRows, previousRow]);

  const filterCourses: (query: string) => Course[] = useCallback((query) => {
    if (!courseData.courses) {
      return [];
    } else if (!query) {
      return courseData.courses;
    }
    return courseData.courses?.filter(course => (
      course.id.toLowerCase().startsWith(query!.toLowerCase())
    ));
  }, [courseData.courses]);

  const removeFromQueryDictionaries: (key: string) => void = useCallback((key) => {
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

  const removeFromAllDictionaries: (key: string) => void = useCallback((key) => {
    removeFromQueryDictionaries(key);
    setGradeValues(prev => {
      const newDict = new Map(prev);
      newDict.delete(key);
      return newDict;
    });
  }, []);

  /**
   * This handles the insertion of a course entry into either 
   * (a) an empty schedule
   * (b) a real schedule (scheduleId is non null)
   * @param key The key of the row to create an entry for (begins with 'XX' always)
   */
  const addActiveCourse: (key: string) => Promise<void> = useCallback(async (key: string) => {
    if (!scheduleRows || !activeResults) {
      setError('Missing required data.');
      return;
    } else if (!activeResults.has(key)) {
      setError('Didn\'t find a course to add');
      return;
    }

    try {
      const courseId = activeResults.get(key)!;
      if (scheduleRows.some(row => row.key === courseId)) {
        setError('You already added this course.');
        setRerenderCount(prev => prev! + 1); /** Activate the input ref again */
        return;
      }

      let newRows: TermTableRow[] = [];
      let isUpdate: boolean = false;
      if (previousRow && !previousRow.key.startsWith('XX')) {
        /** 
         * We have a real previous row we're replacing. 
         * Assume that all real rows are greedily at the front of the list.
        */
        newRows = [
          ...scheduleRows.slice(0, activeIndex),
          { key: courseId, course_id: courseId, entry_id: previousRow.entry_id, },
          ...scheduleRows.slice(activeIndex + 1)
        ];
        isUpdate = true;
      } else {
        /** We're simply adding on top of an empty row */
        newRows = [
          ...scheduleRows!.filter(row => row.key !== key && !row.key.startsWith('XX')),
          { key: courseId, course_id: courseId, }, /** No entryId yet */
          ...scheduleRows!.filter(row => row.key !== key && row.key.startsWith('XX')) /** In some cases we may have multiple emoty rows */
        ];
      }

      if (!newRows.some(row => row.key.startsWith('XX'))) { 
        newRows = addEmptyRow(newRows, true); /** Only add if we don't have an empty row */
      }

      setScheduleRows(newRows);
      setDisablePointerEvents(true); /** Disable pointer events to avoid hovering again */
      setGradeValues(prev => {
        const newDict = new Map(prev);
        newDict.set(courseId, isUpdate ? gradeValues.get(previousRow!.key)! : '');
        return newDict;
      });
      removeFromAllDictionaries(key);

      /** At this point we definitely have an empty row (or multiple), so select the first one */
      const firstEmptyIndex = newRows.findIndex(row => row.key.startsWith('XX'));
      setActiveKey(newRows[firstEmptyIndex].key);
      setPreviousRow(newRows[firstEmptyIndex]);
      setActiveIndex(firstEmptyIndex);
      setRerenderCount(prev => prev! + 1);

      if (isUpdate && scheduleId) {
        const entryId = scheduleRows[activeIndex].entry_id as number;
        await entryHandlers.updateEntry(schedule!.schedule_id, entryId, courseId);
        /** To-do: add some error handling in the case that this returns null */

      } else if (scheduleId) {

        const newEntry = await entryHandlers.createEntry(schedule!.schedule_id, courseId);
        /** To-do: more error handling */

        /** 
         * It only remains to make sure we update the newRows with the right entry_id, so that we can delete it later. 
         * Note that here we don't actually trigger a rerender of the rows, since the objects remain the same.
        */
        setScheduleRows(prev => {
          const insertIndex = prev!.findIndex(row => row.key === courseId)!;
          const newArr = [
            ...prev!.slice(0, insertIndex), 
            { ...prev![insertIndex], entry_id: newEntry!.entry_id },
            ...prev!.slice(insertIndex + 1)
          ];
          return newArr;
        });
      }
    } catch (error) {
      console.error(error);
      setError('Unable to insert into schedule.');
    }
  }, [activeResults, scheduleRows, activeIndex]);

  useEffect(() => {
    if (termSelected === term) {
      console.log(gradeValues);
    }
  }, [gradeValues]);

  useEffect(() => {
    if (termSelected === term) {
      console.log(scheduleRows);
    }
  }, [scheduleRows]);

  /**
   * This handles the deletion of either
   * (a) a real course (we'll know this if previousRow.key !== 'XX AAAA' )
   * (b) an empty row
   */
  const removeRealRow: (key: string) => Promise<void> = useCallback(async (key) => {
    try {
      const newRows = [...scheduleRows!.filter(row => row.key !== key)];
      setScheduleRows(newRows);
      
      const deletedCourse = previousRow!.key;
      setGradeValues(prev => {
        const newDict = new Map(prev);
        newDict.delete(deletedCourse);
        return newDict;
      });

      /**
       * After deleting the row & updating schedule rows,
       * either select the row right before us or deselect all.
       */
      const deletedIndex = scheduleRows!.findIndex(row => row.key === activeKey);
      if (newRows.length > 0) {
        const newSelectedKey = deletedIndex === 0 
          ? newRows[deletedIndex].key 
          : newRows[deletedIndex - 1].key;

        handleSelectRow(newSelectedKey, newRows);
        setDisablePointerEvents(true);
        setRerenderCount(prev => prev! + 1);
      } else {
        setPreviousRow(null);
        setActiveKey(null);
        setActiveIndex(-1);
      }
      removeFromAllDictionaries(key);

      /** 
       * If the item we just removed was a real entry, delete from schedule.
       */
      if (previousRow && !previousRow.key.startsWith('XX') && schedule) {
        await entryHandlers.deleteEntry(schedule.schedule_id, Number(previousRow!.entry_id));
      }
    } catch (error) {
      console.error(error);
      setError('Unable to remove from schedule.');
    }
  }, [scheduleRows, previousRow, activeKey]);

  /**
   * Adds an empty row to scheduled rows (based on the current empty index to avoid collisions).
   * Optional param to pass in a collection of rows to filter. Optional param to return the 
   * rows rather than set scheduleRows.
   * @param rows Optional rows to filter
   * @param returnList Optional param to return rather than set
   */
  const addEmptyRow: (
    rows?: TermTableRow[], 
    returnList?: boolean
  ) => TermTableRow[] = useCallback((rows?, returnList?) => {
    if (scheduleRows!.length == 7) {
      /** Don't add more than seven courses */
      setError('Unable to insert more than seven courses.');
      return [];
    }
    const oldRows = rows ? rows : activeKey ? handleDeselect() : scheduleRows!;
    const paddedNumber = emptyIndex.toString().padStart(4, '0');
    const key = `XX ${paddedNumber}`;
    setEmptyIndex(prev => prev + 1);

    let newRows: TermTableRow[] = [];
    /** 
     * 1. If oldRows is empty, just add the empty row and continue.
     * 2. If the current row selected is a real course (and potentially has real courses underneath it), 
     *    just add the empty row underneath all the non empty ones. 
     *    Otherwise, add the empty row directly underneath our current row.
     * 
     *    UPDATE Jan 25 --> Always add the new row directly underneath all rows.
     */
    const emptyRow: TermTableRow = { key: key, course_id: key };
    newRows = [...oldRows, emptyRow];

    setGradeValues(prev => new Map(prev).set(key, ''));
    if (returnList) {
      return newRows;
    }
    setDisablePointerEvents(true); /** Disable pointer events to avoid hovering again */
    setHoverRow(null);
    setScheduleRows(newRows);
    setActiveKey(key);
    setPreviousRow(newRows.find(row => row.key === key)!);
    setActiveIndex(newRows.findIndex(row => row.key === key));

    return newRows;
  }, [emptyIndex, scheduleRows, activeKey, handleDeselect]);

  /**
   * Handles search value changing. Plus, manually retriggers a rerender in the case that
   * the key is the same (most of the time).
   * @param value Value which is queried
   * @param key Key of the row which is queried on
   */
  const onSearchChange: (value: string, key: string) => void = useCallback((value, key) => {
    /** Avoid modifying query or results if we just deleted an entry via pressing 'backspace' */
    if (noChange) {
      return;
    }
    setQueryValues(prev => new Map(prev).set(key, value));
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
  }, [filterCourses, noChange]);

  const handleDeselectGrade: () => void = useCallback(() => {
    if (!activeGradeKey) {
      return;
    }
    /** Reset the entry grade map */
    if (previousGrade && gradeValues.get(activeGradeKey) !== '') {
      setGradeValues(prev => new Map(prev).set(activeGradeKey, previousGrade));
    }
    setPreviousGrade(null);
    setActiveGradeKey(null);
  }, [activeGradeKey, previousGrade]);

  /**
   * Handles the selection of a grade cell.
   * @param key The key of the row which has the grade cell being edited.
   */
  const handleSelectGrade: (key: string) => void = useCallback((key) => {
    if (activeGradeKey && activeGradeKey === key) { 
      handleDeselectGrade();
      return;
    }

    let normKey: string = key;
    let rows: TermTableRow[] = scheduleRows!;
    if (activeKey) {
      rows = handleDeselect();
      normKey = activeKey === key ? previousRow!.key : key; /** Weird edge case where we select a grade belonging to an empty row */
    }

    /** 
     * In the case that we're a row being edited and selecting the grade
     * right to our right, gradeValues.get(key) won't return anything, so use the 
     * previous row's key (normkey) and set previous grade to that grade.
     */
    if (gradeValues.get(normKey)!.length > 0) {
      setPreviousGrade(gradeValues.get(normKey)!);
    } else {
      setPreviousGrade(null);
    }
    setActiveGradeKey(normKey);

    const index = rows.findIndex(row => row.key === normKey);
    setActiveIndex(index);
    setActiveCol(1);

    /** Suggested grade at this point should be null. */
  }, [gradeValues, activeGradeKey, activeKey, handleDeselect, handleDeselectGrade, previousRow, scheduleRows]);

  /**
   * Handles grade value changing.
   * @param value Value which is queried
   * @param key The key which is used
   */
  const onGradeChange: (value: string, key: string) => void = useCallback(async (value, key) => {
    value = value.toUpperCase();
    if (!POSSIBLE_GRADES.some(el => el === value) && value !== '') {
      setError('Must insert a valid grade (A, B, C, D, F, W).');
      return;
    }
    setGradeValues(prev => prev.set(key, value));
    if (value !== '') {
      handleDeselectGrade();
    }
    setRerenderCount(prev => prev! + 1); /** Manually rerender since key isn't changing */

    const entryId = scheduleRows!.find(row => row.key === key)!.entry_id as number;
    if (value !== '' && scheduleId && entryId) {
      setPreviousGrade(null);

      if (previousGrade && scheduleId) {
        await gradeHandlers.updateGrade(scheduleId!, term, entryId, value);
      } else if (scheduleId) {
        await gradeHandlers.createGrade(scheduleId!, term, entryId, value);
      }
    } else if (scheduleId) {
      await gradeHandlers.deleteGrade(scheduleId!, term, entryId);
    }
  }, [previousGrade, scheduleId, scheduleRows, gradeHandlers, handleDeselectGrade]);

  const handleKeyDown: (
    e: React.KeyboardEvent<HTMLInputElement>, 
    key: string, 
    type: GradeCourseType
  ) => void = useCallback((e, key, type) => {
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
  }, [addActiveCourse, activeResults, termSelected]);

  const incrementIndex: () => void = useCallback(() => {
    if (!scheduleRows) {
      return;
    }
    const newIndex = Math.min(activeIndex + 1, scheduleRows.length);
    if (newIndex !== scheduleRows.length) {
      if (activeCol === 0) {
        handleSelectRow(scheduleRows[newIndex].key);
      } else {
        handleSelectGrade(scheduleRows[newIndex].key);
      }
    } else {
      if (activeCol === 0) {
        handleDeselect();
      } else {
        handleDeselectGrade();
      }
    }
    setActiveIndex(newIndex);
    setHoverRow(null); /** Prevent the user from hovering immediately after */
    setHoverGrade(null);
    setDisablePointerEvents(true);
  }, [activeKey, scheduleRows, activeIndex, activeCol]);

  const decrementIndex: () => void = useCallback(() => {
    if (!scheduleRows) {
      return;
    }
    const newIndex = Math.max(activeIndex - 1, -1);
    if (newIndex !== -1) {
      if (activeCol === 0) {
        handleSelectRow(scheduleRows[newIndex].key);
      } else {
        handleSelectGrade(scheduleRows[newIndex].key);
      }
    } else {
      if (activeCol === 0) {
        handleDeselect();
      } else {
        handleDeselectGrade();
      }
    }
    setActiveIndex(newIndex);
    setHoverRow(null);
    setHoverGrade(null);
    setDisablePointerEvents(true);
  }, [activeIndex, scheduleRows, activeCol]);

  const incrementCol: () => void = useCallback(() => {
    if (!scheduleRows || activeIndex === -1 || activeIndex === scheduleRows.length || activeCol === 1) {
      return;
    }
    handleSelectGrade(scheduleRows[activeIndex].key);
    setActiveCol(1);
    setHoverRow(null);
    setDisablePointerEvents(true);
  }, [activeCol, scheduleRows, activeIndex, handleSelectGrade]);

  const decrementCol: () => void = useCallback(() => {
    if (!scheduleRows || activeIndex === -1 || activeIndex === scheduleRows.length || activeCol == 0) {
      return;
    }
    handleSelectRow(scheduleRows[activeIndex].key);
    setActiveCol(0);
    setHoverGrade(null);
    setDisablePointerEvents(true);
  }, [activeCol, scheduleRows, activeIndex, handleSelectRow]);

  const handleShortcuts: (e: KeyboardEvent) => void = useCallback((e: KeyboardEvent) => {
    const metaKey = e.metaKey || e.ctrlKey;
    const correctTerm = termSelected === term;
    if (!correctTerm) {
      return;
    }

    if (metaKey && e.key === 'Enter') {
      addEmptyRow();
    } else if (e.key === 'ArrowDown') {
      incrementIndex();
    } else if (e.key === 'ArrowUp') {
      decrementIndex();
    } else if (e.key === 'ArrowLeft') {
      decrementCol();
    } else if (e.key === 'ArrowRight') {
      incrementCol();
    } else if (metaKey && e.key === 'Backspace' && activeKey && !activeGradeKey) {
      setNoChange(true);
      setTimeout(() => {
        setNoChange(false);
      }, 1000);
      removeRealRow(activeKey);
    }
  }, [activeKey, termSelected, activeGradeKey, 
    removeRealRow, addEmptyRow, incrementIndex, decrementIndex, decrementCol, incrementCol]);

  const handleClickOutside: (event: MouseEvent) => void = useCallback((event) => {
    if (tableRef && !tableRef.current!.contains(event.target as Node) && termSelected === term) {
      handleDeselect();
      handleDeselectGrade();
    }
  }, [termSelected, tableRef, handleDeselect, handleDeselectGrade]);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleShortcuts);
    return () => {
      window.removeEventListener('keydown', handleShortcuts); 
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handleShortcuts, handleClickOutside, disablePointerEvents]);

  const scheduleData: {
    average: number | null,
    credits: number | null
  } = useMemo(() => {
    if (!scheduleRows || !courseMaps.averagesMap) {
      return { 
        average: null, 
        credits: null 
      };
    }
    let average = 0;
    let credits = 0;
    scheduleRows.forEach(row => {
      if (row.key.startsWith('XX') || !courseMaps.averagesMap!.has(row.key)) {
        return;
      }
      const courseGpa = courseMaps.averagesMap!.get(row.key)!.GPA!;
      const numCredits = Number(courseMaps.courseMap!.get(row.key)!.credits);
      average = (average * credits + courseGpa * numCredits) / (credits + numCredits);
      credits += numCredits;
    });
    return { 
      average, 
      credits 
    };
  }, [scheduleRows, courseMaps.averagesMap, courseMaps.courseMap]);

  const formatEmptyCourseID: (item: TermTableRow) => JSX.Element = useCallback((item) => {
    const inActiveResults = activeResults.has(item.key) && activeResults.get(item.key);
    const inQueryValues = queryValues.has(item.key) && queryValues.get(item.key)!.length > 0;
    const shouldBeHighlighted = item.key === hoverRow || item.key === activeKey;

    return (
      <TableCell
        className={`text-sm ${shouldBeHighlighted && 'bg-gray-100'} border-b`}
        onClick={() => handleSelectRow(item.key)}
      >
        <div className="relative rounded-lg max-h-xs rounded-none border-b border-gray-400 py-1 pr-1 z-10 w-80">
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
                  inputRefs.current.set(item.key, { 
                    current: el 
                  });
                }
              }}
              value={queryValues.get(item.key)?.toUpperCase()}
              onChange={(e) => {
                onSearchChange(e.target.value, item.key);
              }}
              onFocus={(e) => e.stopPropagation()}
              onKeyDown={(e) => handleKeyDown(e, item.key, 'course')}
              className={`text-search bg-transparent z-2 outline-none w-80`}
            />
          </div>
        </div>
      </TableCell>
    );
  }, [activeResults, queryValues, rerenderCount, inputRefs, activeKey]);

  const formatGradeInput: (item: TermTableRow) => JSX.Element = useCallback((item) => {
    return (
      <TableCell
        className={`
          border-b border-gray-200 text-sm grade-cell
          ${(item.key === hoverGrade || activeGradeKey === item.key) && 'bg-gray-100'}`
        }
        onClick={() => handleSelectGrade(item.key)}
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
            {(activeGradeKey !== item.key || gradeValues.get(item.key) === '') && (
              <span className={`text-gray-400`}>
                {'+X'}
              </span>
            )}
          </div>
          {/** Input field is necessary here in order to properly give border to div */}
          <div className="flex flex-row gap-0 items-center">
            {/** onFocus=(stop propagation) needed to prevent row from being selected */}
            <input
              id={`searchbar-${item.key}`}
              type="text"
              ref={(el) => {
                if (el) {
                  gradeInputRefs.current.set(item.key, { 
                    current: el 
                  });
                }
              }}
              value={activeGradeKey === item.key && gradeValues.get(item.key) !== '' ? previousGrade! : ''}
              onChange={(e) => onGradeChange(e.target.value, item.key)}
              onFocus={(e) => e.stopPropagation()}
              onKeyDown={(e) => handleKeyDown(e, item.key, 'grade')}
              placeholder=""
              className={`text-search bg-transparent z-2 outline-none w-5 ${activeGradeKey === item.key && previousGrade ? '' : ''}`}
            />
          </div>
        </div>
      </TableCell>
    );
  }, [gradeInputRefs, hoverGrade, previousGrade, activeGradeKey, activeKey]);

  const nextToolTipDisplayContent: JSX.Element = useMemo(() => {
    if (!scheduleRows || !courseMaps.averagesMap) {
      return <></>;
    }
    const nonEmptyAndNonNan: TermTableRow[] = scheduleRows.filter(
      row => !row.key.startsWith('XX') && courseMaps.averagesMap!.has(row.key)
    );

    const numItems = nonEmptyAndNonNan.length;
    return (
      <p className="text-sm">
        {`Weighted by number of credits for each class. ${numItems !== 0 ? (
          `The value ${Number(scheduleData.average).toFixed(2)} is currently averaging 
            ${nonEmptyAndNonNan.map((row => {
              return ` ${row.key}`
            }))} (${numItems} items)`
        ) : (
          ''
        )}`}
      </p>
    )
  }, [scheduleRows, scheduleData]);

  /**
   * All of our hovering logic is handled in this useCallback. The purpose of this is to avoid
   * having to repeat onMouseEnter and onMouseLeave, which are both prone to bugs, especially
   * when the component remounts (e.g. adding or removing a course). Instead, just always track 
   * the mouse and check whether or not we're currently hovering over (a) a grade cell, or (b) a 
   * row. If neither are, true, set both hover states to null.
   * @param e Mouseevent
   */
  const handleMouseMove: (e: MouseEvent) => void = useCallback((e) => {
    if (!tableRef.current) {
      return;
    }
    const cells = tableRef.current.querySelectorAll('td');
    const mouseX = e.clientX;
    const mouseY = e.clientY;

    let isOverCell = false;
    cells.forEach((cell) => {
      const rect = cell.getBoundingClientRect();
      if (mouseX >= rect.left && mouseX <= rect.right && mouseY >= rect.top && mouseY <= rect.bottom) {
        isOverCell = true;
        const row = cell.closest('tr');
        const isGradeCell = cell.classList.contains('grade-cell');
        if (isGradeCell) {
          setHoverGrade(row?.getAttribute('data-key') || null);
          setHoverRow(null);
        } else {
          const isActionCell = cell.classList.contains('actions');
          if (!isActionCell) {
            setHoverRow(row?.getAttribute('data-key') || null);
            setHoverGrade(null);
          } else {
            setHoverGrade(null);
          }
        }
      }
    });
    if (!isOverCell) {
      setHoverRow(null);
      setHoverGrade(null);
    }
    if (disablePointerEvents) {
      setDisablePointerEvents(false);
      setRerenderCount(prev => prev! + 1); /** Necessary to allow cursor-movement again */
    }
  }, [disablePointerEvents, tableRef]);

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, [handleMouseMove]);

  return (
    <div 
      className="flex flex-col gap-2 min-w-600 max-w-700"
      onClick={() => {
        degreePlanHandlers.setTermSelected(term);
      }}
    >
      <div className="flex flex-row gap-2 items-center">
        <h1 className="heading-sm">{term}</h1>
        <TermTableDropdown 
          term={term}
        />
      </div>
      <div className="flex flex-row gap-8 w-full py-2 rounded rounded-lg">
        <ScheduleDropdown 
          selectedOption={schedule ? schedule.schedule_id! : 'select'}
        />
        <div className="flex flex-row gap-4 items-center">
          <div className="flex flex-row gap-2 items-center">
            <NextToolTip content={nextToolTipDisplayContent} className="w-300">
              <InfoIcon 
                style={{ 
                  width: '15px' 
                }} 
              />
            </NextToolTip>
            <p className="text-sm font-semi-bold">Schedule GPA</p>
          </div>
          {scheduleData.average && scheduleData.average !== 0 ? (
            <p 
              className="text-sm font-semi-bold" 
              style={{ 
                color: formatGPA(scheduleData.average) 
              }}
            >
              {Number(scheduleData.average).toFixed(2)}
            </p>
          ) : (
            <p className="text-gray-400 text-sm">N/A</p>
          )}
        </div>
        <div className="flex flex-row gap-4 items-center">
          <p className="text-sm font-semi-bold">Num Credits</p>
          {scheduleData.credits && scheduleData.credits !== 0 ? (
            <p className="text-sm">
              {Number(scheduleData.credits).toFixed(2)}
            </p>
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
                key={`${item.key}`} 
                className="cursor-pointer"
              >
                {(columnKey) => {

                  const value = getKeyValue(item, columnKey);
                  const isEmptyOrEditing = item.key.startsWith('XX');

                  let hasGradeValue = false;
                  let grade = null;
                  /** 
                   * Discriminate between obtaining grades via the previous row
                   * (if the row is currently selected)
                   * or just with the item.key.
                   */
                  if (activeKey === item.key) {
                    hasGradeValue = previousRow && gradeValues.has(previousRow!.key) && gradeValues.get(previousRow!.key)!.length > 0 || false;
                    if (hasGradeValue) {
                      grade = gradeValues.get(previousRow!.key)!;
                    }
                  } else {
                    hasGradeValue = gradeValues.has(item.key) && gradeValues.get(item.key)!.length > 0;
                    grade = gradeValues.get(item.key)!;
                  }

                  let course = null;
                  let averageGpa = null;
                  /**
                   * Every row will necessarily have either
                   *  (a) an entry in activeResults (e.g. XX 0000 -> CS 1332)
                   *   or (b) a real course ID key (e.g. just CS 1332)
                   *   or (c) neither (if it's completely new and empty)
                   */
                  if (activeResults.has(item.key) && activeResults.get(item.key)) {
                    course = courseMaps.courseMap?.get(activeResults.get(item.key)!)!; 
                    averageGpa = courseMaps.averagesMap?.get(activeResults.get(item.key)!)?.GPA || 'N/A';
                  } else if (!isEmptyOrEditing) {
                    course = courseMaps.courseMap?.get(item.key)!;
                    averageGpa = courseMaps.averagesMap?.get(item.key)?.GPA || 'N/A';
                  }
                  const isActive = item.key === activeKey;
                  /** 
                   * Hover row indicates where the cursor currently is, but we should also be able
                   * to highlight a row based on whetehr it's currently active.
                   */
                  const shouldBeHighlighted = isActive || hoverRow === item.key;

                  if (columnKey === 'course_id') {
                    return isEmptyOrEditing 
                      ? formatEmptyCourseID(item) : (
                        <TableCell
                          className={`
                            ${shouldBeHighlighted && 'bg-gray-100'} 
                            border-b border-gray-200
                            ${disablePointerEvents && 'pointer-events-none'}
                          `}
                          onClick={() => handleSelectRow(item.key)}
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
                          grade-cell border-b border-gray-200
                        `}
                        onClick={() => handleSelectGrade(item.key)}
                      >
                        {grade}
                      </TableCell>
                    ) : formatGradeInput(item); /** Otherwise, handle empty action */
                  } else if (columnKey === 'actions') {
                    return isEmptyOrEditing ? (
                      <TableCell className={`actions ${isActive ? '' : 'pointer-events-none'}`}>
                        <div 
                          className={`
                            flex flex-col relative
                            delete-icon ${isActive ? 'opacity-50 hover:opacity-100' : 'opacity-0'} 
                            hover:scale-110 cursor-pointer transition-transform
                            hover:mb-1
                          `}
                          onClick={(e) => {
                            e.stopPropagation(); 
                            removeRealRow(item.key);
                          }}
                          onMouseEnter={() => {
                            setHoverDelete(true);
                          }}
                          onMouseLeave={() => {
                            setHoverDelete(false);
                          }}
                        >
                          <DeleteIcon 
                            className={`
                              transition-all duration-300 ease-in-out
                            `}
                            style={{ 
                              width: '20px',
                              height: '20px' 
                            }} 
                          />
                        </div>
                      </TableCell>
                    ) : (
                      <TableCell
                        className="invisible p-0 actions pointer-events-none"
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
      <div className="flex flex-row justify-end gap-4 items-center mr-[5%]">
        <p className="text-sm text-red-fe466c w-fit text-right opacity-90">{error}</p>
        {activeKey && (
          <div className={`flex flex-row items-center`}>
            <Link 
              className={`text-sm hover:underline cursor-pointer text-gray-500`}
              onClick={() => {
                removeRealRow(activeKey!);
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