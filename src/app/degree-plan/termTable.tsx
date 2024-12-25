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
import { useCourses } from "../contexts/course/provider";
import { useProfile } from "../contexts/profile/provider";
import { ScheduleInfo } from "../api/schedule";
import SelectionDropdown from "../shared/selectionDropdown";

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
  rows: TermTableRow[];
  term: string;
  info: ScheduleInfo | null;
  scheduleSelected: string;
  setScheduleSelected: Dispatch<SetStateAction<string | null>>;
  replaceScheduleAssignment: (term: string, schedule: ScheduleInfo) => void;
}

export type Course = CourseInfo | null;

const TermTable: FC<TermTableProps> = ({
  rows,
  term,
  info,
  scheduleSelected,
  setScheduleSelected,
  replaceScheduleAssignment,
}: TermTableProps) => {
  
  const [emptyIndex, setEmptyIndex] = useState<number>(1);
  const [scheduleRows, setScheduleRows] = useState<TermTableRow[]>(() => {
    if (rows.length === 0) {
      return [{ key: `XX 0000`, course_id: 'XX 0000' }];
    }
    return [...rows];
  });
  const [queryValues, setQueryValues] = useState<Map<string, string>>(new Map());
  const [activeResults, setActiveResults] = useState<Map<string, string | null>>(new Map());
  const [error, setError] = useState<string | null>(null);
  const [previousRow, setPreviousRow] = useState<TermTableRow | null>(null);
  const [rerenderCount, setRerenderCount] = useState<number | null>(0);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const inputRefs = useRef<Map<string, MutableRef<HTMLInputElement>>>(new Map());
  const tableRef = useRef<HTMLDivElement | null>(null);

  const { courses, courseMap, averagesMap } = useCourses();
  const { schedules } = useProfile();
  const router = useRouter();

  /** Runs every instance of activeKey changing (extremely regularly) */
  useEffect(() => {
    setRerenderCount(prev => prev! + 1);
  }, [activeKey]);

  useEffect(() => {
    if (scheduleSelected === term) {
      console.log(info);
    } 
  }, [scheduleSelected]);

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
      let index = scheduleRows.findIndex((row: TermTableRow) => row.key === key);
      if (activeIndex !== index) {
        setActiveIndex(index);
      }
      setPreviousRow(scheduleRows.find(row => row.key === key)!);
      return;
    }
    let newRows: TermTableRow[] = previousRow ? handleDeselect() : scheduleRows;
    const paddedNumber = emptyIndex.toString().padStart(4, '0');
    setEmptyIndex(prev => prev + 1);
    let index = newRows.findIndex((row: TermTableRow) => row.key === key);
    let prevRow = newRows.find((row: TermTableRow) => row.key === key);
    setPreviousRow(prevRow!);

    if (activeIndex !== index) {
      setActiveIndex(index);
    }

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
      return scheduleRows;
    } else if (activeKey.startsWith('XX') && previousRow!.key.startsWith('XX')) {
      setPreviousRow(null);
      setActiveKey(null);
      return scheduleRows;
    }
    let index = scheduleRows.findIndex((row: TermTableRow) => row.key === activeKey);
    const newRows = [
      ...scheduleRows.slice(0, index),
      { ...scheduleRows[index], key: previousRow!.key },
      ...scheduleRows.slice(index + 1)
    ];
    setScheduleRows(newRows);
    removeFromDictionaries(activeKey!);
    setPreviousRow(null);
    setActiveKey(null);
    return newRows;
  }, [activeKey, scheduleRows, previousRow]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tableRef && !tableRef.current!.contains(event.target as Node) && scheduleSelected === term) {
        handleDeselect();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handleDeselect, scheduleSelected, term]);

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
        ...scheduleRows.filter(row => row.key !== key && !row.key.startsWith('XX')),
        { key: course_id, course_id: course_id },
        ...scheduleRows.filter(row => row.key !== key && row.key.startsWith('XX')) 
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
      setActiveIndex(firstEmptyIndex);
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
      setScheduleRows((prev: TermTableRow[]) => {
        const newRows = [...prev.filter(row => row.key !== key)];
        /** If there's an empty row available, activate it */
        if (newRows.find((row: TermTableRow) => row.key.startsWith('XX'))) {
          /** If we just deleted the empty row we were on */
          if (activeIndex === newRows.length) {
            setActiveKey(newRows[newRows.length - 1].key);
            setPreviousRow(newRows[newRows.length - 1]);
            setActiveIndex(newRows.length - 1);
          } else {
            let newRow = newRows[activeIndex!];
            setActiveKey(newRow.key);
            setPreviousRow(newRow);
          }
        } else {
          setActiveKey(null);
          setPreviousRow(null);
        }
        return newRows;
      });
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
  }, [activeIndex, previousRow]);

  /**
   * Adds an empty row to scheduled rows (based on the current empty index to avoid collisions).
   * Optional param to pass in a collection of rows to filter.
   */
  const addEmptyRow: (rows?: TermTableRow[]) => TermTableRow[] = useCallback((rows?) => {
    if (scheduleRows.length == 7) {
      /** Don't add more than seven courses */
      setError('Unable to insert more than seven courses.');
      return [];
    } 
    let myRows = rows ? rows : activeKey ? handleDeselect() : scheduleRows;
    const paddedNumber = emptyIndex.toString().padStart(4, '0');
    setEmptyIndex((prev) => prev + 1);
    const key = `XX ${paddedNumber}`;

    let newRows: TermTableRow[] = [];
    /** 
     * 1. If myRows is empty, just add the empty row and continue.
     * 2. If the current row selected isn't empty, just add the empty row underneath all the non
     * empty ones. Otherwise, add the empty row directly underneath our current row.
     */
    if (myRows.length === 0) {
      newRows = [{ key: key, course_id: 'XX 0000 '}];
    } else if (activeIndex! < 0 || activeIndex! >= myRows.length || !myRows[activeIndex!].key.startsWith('XX')) {
      newRows = [ 
        ...myRows.filter(row => !row.key.startsWith('XX')), 
        { key: key, course_id: 'XX 0000' }, 
        ...myRows.filter(row => row.key.startsWith('XX'))
      ];
    } else {
      newRows = [
        ...myRows.slice(0, activeIndex! + 1),
        { key: key, course_id: 'XX 0000' }, 
        ...myRows.slice(activeIndex! + 1)
      ];
    }
    setScheduleRows(newRows);
    setActiveKey(key);
    setActiveIndex(newRows.findIndex(row => row.key === key)!);
    setPreviousRow(newRows.find(row => row.key === key)!);
    return newRows;
  }, [emptyIndex, scheduleRows, activeKey, activeIndex]);

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
    if (activeIndex === scheduleRows.length) {
      setError('No more rows to select');
    } else {
      setError('');
    }
    let newIndex = activeIndex === null ? 0 : Math.min(activeIndex + 1, scheduleRows.length);
    if (newIndex !== scheduleRows.length) {
      handleSelectRow(scheduleRows[newIndex].key);
    } else {
      handleDeselect();
    }
    setActiveIndex(newIndex);
  }, [activeIndex, scheduleRows]);

  const decrementIndex: () => void = useCallback(() => {
    if (activeIndex === -1) {
      setError('No more rows to select');
    } else {
      setError('');
    }
    let newIndex = activeIndex === null ? scheduleRows.length - 1 : Math.max(activeIndex - 1, -1);
    if (newIndex !== -1) {
      handleSelectRow(scheduleRows[newIndex].key);
    } else {
      handleDeselect();
    }
    setActiveIndex(newIndex);
  }, [activeIndex, scheduleRows]);

  const handleShortcuts: (e: KeyboardEvent) => void = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && scheduleSelected === term) {
      addEmptyRow();
    } else if (e.key === 'ArrowDown' && scheduleSelected === term) {
      /** Start scrolling through items */
      incrementIndex();
    } else if (e.key === 'ArrowUp' && scheduleSelected === term) {
      decrementIndex();
    } else if ((e.metaKey || e.ctrlKey) && e.key === 'Backspace' && scheduleSelected === term) {
      if (!activeKey) {
        return;
      }
      removeInsertedCourse(activeKey);
    }
  }, [setActiveIndex, activeIndex, scheduleSelected, scheduleRows]);

  useEffect(() => {
    window.addEventListener('keydown', handleShortcuts);
    return () => {
      window.removeEventListener('keydown', handleShortcuts);
    };
  }, [handleShortcuts]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>, key: string) => {
    /** Handles case of inserting rows with cmd-enter */
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && scheduleSelected === term) {
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
    let average = 0;
    let credits = 0;
    for (const row of scheduleRows) {
      if (row.key.startsWith('XX')) {
        continue;
      }
      const courseGpa = averagesMap?.get(row.key)?.GPA!;
      const numCredits = Number(courseMap?.get(row.key)!.credits!);
      average = (average * credits + courseGpa * numCredits) / (credits + numCredits);
      credits += numCredits;
    }
    return average;
  }, [scheduleRows]);

  const numCredits: number | null = useMemo(() => {
    let numCredits = 0;
    for (const row of scheduleRows) {
      if (row.key.startsWith('XX')) {
        continue;
      }
      numCredits += Number(courseMap?.get(row.key)?.credits!);
    }
    return numCredits;
  }, [scheduleRows]);

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

  const trigger: React.ReactNode = useMemo(() => {
    return (
      <div className="border border-gray-400 bg-white px-4 py-1 rounded-md hover:bg-gray-100 cursor-pointer w-fit">
        <p className="text-sm">{info?.name}</p>
      </div>
    );
  }, [info]);

  const scheduleOptions: Array<{ 
    label: string;
    onClick: () => void;
  }> = useMemo(() => {
    return [
      'Create a new schedule',
      ...schedules!,
    ]!.map((schedule: ScheduleInfo | string) => ({
      label: schedule === 'Create a new schedule' ? schedule : (schedule as ScheduleInfo).name!,
      onClick: () => {
        if (schedule === 'Create a new schedule') {

        } else {
          replaceScheduleAssignment(term, schedule as ScheduleInfo);
        }
      }
    }));
  }, [schedules]);

  return (
    <div 
      className="flex flex-col gap-2"
      onClick={() => {
        setScheduleSelected(term);
      }}
    >
      <div className="flex flex-row gap-8 w-full bg-levels-gray-blue px-4 py-2 rounded rounded-lg">
        {info && (
          <div className="w-fit">
            <SelectionDropdown 
              options={scheduleOptions}
              selectedOption={info.name!}
              customTrigger={trigger}
            />
          </div>
        )}
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
        <TableBody items={scheduleRows!}>
          {(item) => (
            <TableRow 
              key={`${item.key}`} 
              className={`border-b border-gray-200 hover:bg-gray-100 cursor-pointer`}
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