'use client'

import { Dispatch, FC, Fragment, memo, SetStateAction, useCallback, useEffect, useMemo, useState } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableColumn, 
  TableHeader, 
  TableRow, 
  Pagination, 
  SortDescriptor,
  Input,
  getKeyValue,
  Spinner,
  Link,
} from "@nextui-org/react";
import { SearchIcon } from "../../../public/icons/searchIcon";
import { useAsyncList } from "@react-stately/data";
import FlexCol from "../deprecated/design-system/flexCol";
import { expandableProfColumns, formatGPA, GradeTableColumn, GradeTableRow } from "./gradeTable";
import { Key, Selection } from '@react-types/shared';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { courseCols, professorCols } from "./professorOrCourseTable";
import { useRouter } from "next/navigation";
import { useProfs } from "../contexts/server/prof/provider";
import PersonIcon from '@mui/icons-material/Person';

export interface ExpandableTableProps {
  rows: GradeTableRow[];
  sectionRows: Map<string, GradeTableRow[]>;
  forProf: boolean;
}

const ExpandableTable: FC<ExpandableTableProps> = ({
  rows,
  sectionRows,
  forProf,
}: ExpandableTableProps) => {

  const [searchValue, setSearchValue] = useState<string>("");
  const [rowsPerPage, setRowsPerPage] = useState<number>(5);
  const [page, setPage] = useState<number>(1);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

  const { 
    maps
   } = useProfs();
  const router = useRouter();

  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: forProf ? 'professor' : 'course_id',
    direction: 'ascending',
  });

  const numPages = Math.ceil(rows.length / rowsPerPage);
  const hasSearchFilter = Boolean(searchValue);

  /**
   * This sectionRowMap is a tree like structure which
   * maps instructor OR course rows 
   *  -- e.g. (Mary H.B., A: 47.1, B: 29.2, ...) or (ACCT 2101, A: 26.4, B: 31.2, ...)
   * to an array of section rows (e.g. Section: G, A: 39.2, B: 33.4, ...).
   * 
   * Upon rendering the exandable table, the tree is then
   * flattened to construct a simple GradeTableRow array from which
   * to parse out every row, with the section rows being hidden and
   * enabling users to expand upon selecting the parent.
   */
  const sectionRowMap: Map<GradeTableRow, GradeTableRow[]> = useMemo(() => {
    const map: Map<GradeTableRow, GradeTableRow[]> = new Map();
    rows.forEach((row: GradeTableRow) => {
      map.set(row, sectionRows.get(row.key)!);
    });
    /** 
     * e.g. this might be doing rows {course_id: 'ACCT 2101', A: X, B: X, ...} 
     *  maps to {
     *    {section: C, GPA: 2.95, ...}
     *    {section: D, GPA: 3.14, ...}
     *  }
     */
    return map;
  }, [sectionRows]);

  /**
   * Obtains the list of children subrows and maps them to their parent row
   * (importantly, via the key string which represents that subrow which in
   * this case is the section number/letter). This helps us
   * obtain the boolean value of whether our parent row is expanded
   * in constant time. 
   */
  const reverseMapping: Map<string, GradeTableRow> = useMemo(() => {
    const map: Map<string, GradeTableRow> = new Map();
    sectionRowMap.keys().forEach((row: GradeTableRow) => {
      sectionRowMap.get(row)?.forEach((sectionRow: GradeTableRow) => {
        map.set(sectionRow.key, row);
      });
      map.set(row.key + '-section', row); /** Handles header row. e.g. mhb6-section */
    });
    return map;
  }, [sectionRowMap]);

  const filteredItems: GradeTableRow[] = useMemo(() => {
    setSelectedKeys([]);
    if (!hasSearchFilter) {
      return [...rows];
    }
    return [...rows].filter(row => {
      return forProf ? maps.profs!.get(row.professor as string)?.instructor_name.toString().toLowerCase().includes(searchValue.toLowerCase())
        : (row.course_id as string).toLowerCase().includes(searchValue.toLowerCase());
      }
    );
  }, [searchValue, rows]);

  const sortedItems: GradeTableRow[] = useMemo(() => {
    setSelectedKeys([]);
    return [...filteredItems].sort((a, b) => {
      const first = a[sortDescriptor.column!];
      const second = b[sortDescriptor.column!];
      const cmp = first < second ? -1 : first > second ? 1 : 0;

      return sortDescriptor.direction === "descending" ? -cmp : cmp;
    });
  }, [sortDescriptor, filteredItems]);

  const slicedItems: GradeTableRow[] = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return sortedItems.slice(start, end);
  }, [page, sortedItems, rowsPerPage]);

  const formatProf: (profId: string, isSelected: boolean) => JSX.Element = useCallback((profId: string, isSelected: boolean) => {
    return (
      <TableCell className="flex flex-row gap-2">
        {isSelected ? (
          <KeyboardArrowUpIcon />
        ) : (
          <KeyboardArrowDownIcon />
        )}
        <Link 
          onClick={() => {
            router.push(`/prof?profID=${profId}`);
          }}
          className="text-sm hover:underline cursor-pointer"
        >
          {maps.profs!.get(profId)?.instructor_name}
        </Link>
      </TableCell>
    );
  }, [maps.profs]);

  const formatCourse: (courseId: string, isSelected: boolean) => JSX.Element = useCallback((courseId: string, isSelected: boolean) => {
    return (
      <TableCell className="flex flex-row gap-2">
        {isSelected ? (
          <KeyboardArrowUpIcon />
        ) : (
          <KeyboardArrowDownIcon />
        )}
        <Link 
          onClick={() => {
            router.push(`/course?courseID=${courseId}`);
          }}
          className="text-sm hover:underline cursor-pointer"
        >
          {courseId}
        </Link>
      </TableCell>
    );
  }, []);

  const onSearchChange: (value: string) => void = useCallback((value: string) => {
    if (value) {
      setSearchValue(value);
      setPage(1);
    } else {
      setSearchValue("");
    }
  }, []);

  const onClear: () => void = useCallback(() => {
    setSearchValue("");
    setPage(1);
  }, []);

  const onRowsPerPageChange: (e: any) => void = useCallback((e: any) => {
    setRowsPerPage(Number(e.target.value));
    setPage(1);
  }, []);

  /**
   * Only include the search bar if the number of items exceeds rowPerPage.
   * e.g. items (6) > rowsPerpage (5)
   */
  const topContent: React.ReactNode = useMemo(() => {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-row justify-between gap-3 items-end">
          {rows.length > rowsPerPage ? (
            <Input
              className="my-2"
              isClearable
              classNames={{
                base: "w-full sm:max-w-[40%]",
                inputWrapper: "border-1",
              }}
              placeholder={`Search by ${forProf ? 'name...' : 'course ID...'}`}
              startContent={<SearchIcon />}
              value={searchValue}
              onClear={onClear}
              onValueChange={onSearchChange}
            />
          ) : (
            <></>
          )}
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-400">Found {rows.length} {forProf ? ' professors' : ' courses'}</span>
          <label className="flex items-center text-sm">
            Rows per page:
            <select
              className="bg-transparent outline-none text-default-400 text-small"
              onChange={onRowsPerPageChange}
            >
              <option id="1" value="5">5</option>
              <option id="2" value="10">10</option>
              <option id="3" value="15">15</option>
            </select>
          </label>
        </div>
      </div>
    );
  }, [searchValue, onSearchChange, onClear, hasSearchFilter, filteredItems, rowsPerPage]);

  /** 
   * At this point the items has gone through all of the following steps.
   * --> 1. filter via the search bar (happens in filterItems())
   * --> 2. sort based on the sort descriptor selected (professor or course by default)
   * --> 3. slice based on the number of rows per page (just slicedItems())
   * 
   * Now it just remains to parse out these elements (all parent elements mind you, 
   * i.e. rows which just contain instructor/course averages) and push the section averages
   * on top of it for rendering. The order in which this happens is extremely
   * important.
   */
  const flattenTree: () => GradeTableRow[] = useCallback(() => {
    let flattened: GradeTableRow[] = [];
    for (const row of slicedItems) {
      flattened.push({...row});
      /** Row which represents the following subtable. */
      if (forProf) {
        flattened.push({
          key: row.key + '-section',
          professor: 'Section',
          GPA: 'Average GPA',
          A: 'A',
          B: 'B',
          C: 'C',
          D: 'D',
          F: 'F',
          W: 'W',
          enrollment: 'Enrollment',
        });
      } else {
        flattened.push({
          key: row.key + '-section',
          course_id: 'Section',
          GPA: 'Average GPA',
          A: 'A',
          B: 'B',
          C: 'C',
          D: 'D',
          F: 'F',
          W: 'W'
        });
      }
      sectionRowMap.get(row)?.forEach((sectionRow: GradeTableRow) => {
        flattened.push({...sectionRow});
      });
    }
    return flattened;
  }, [sectionRowMap, slicedItems]);

  /**
   * Important that we look at filteredItems here to obtain the
   * strict number of parent instructor rows without slicing, sorting, etc.
   */
  const bottomContent: React.ReactNode = useMemo(() => {
    if (filteredItems.length <= rowsPerPage) {
      return <></>;
    }
    return (
      <div className="py-2 px-2 flex justify-center items-center m-0">
        <Pagination
          isCompact
          showControls
          showShadow
          color="default"
          page={page}
          total={numPages}
          onChange={(page) => setPage(page)}
        />
      </div>
    );
  }, [page, numPages, filteredItems]);

  const memoizedTableBody: React.ReactNode = useMemo(() => {
    const items: GradeTableRow[] = flattenTree();
    return (
      <TableBody emptyContent="No data found" items={items}>
        {(item) => {
          /** If it's a section row it won't have professor or coures_id, but section in that place. */
          const isSelectable = Object.keys(item).includes('professor') || Object.keys(item).includes('course_id');
          const isSubTableHeader = item.key.endsWith('-section');
          const isHidden = (Object.keys(item).includes('section') && !selectedKeys.includes(reverseMapping.get(item.key)!.key))
            || (isSubTableHeader && !selectedKeys.includes(reverseMapping.get(item.key)!.key));
          let idx = -1;

          return (
            <TableRow 
              key={item.key} 
              className={`
                ${isHidden ? 'hidden' : 'border-b border-gray-200'} 
                ${isSelectable ? 'cursor-pointer rounded-sm' : ''} 
                ${isSubTableHeader ? 'bg-gray-100' : ''}
              `}
              onClick={() => {
                if (isSelectable) {
                  setSelectedKeys((prev: string[]) => {
                    if (prev.includes(item.key)) {
                      return prev.filter(key => key !== item.key)
                    } else {
                      return [...prev, item.key];
                    }
                  })
                }
              }}
            >
              {(columnKey) => {
                idx++;
                const isPivotCol = columnKey === 'professor' || columnKey === 'course_id';
                const value = isPivotCol && !isSelectable ? item.section : getKeyValue(item, columnKey);
                if (isPivotCol && !isSelectable && !isSubTableHeader) {
                  /** Render section string */
                  return <TableCell className="pl-8">{value}</TableCell>;
                }

                if (!isSubTableHeader && (columnKey === 'GPA' && value !== undefined && value)) {
                  let color = formatGPA(Number(value));
                  return <TableCell style={{ color: color }} className="font-semibold">{Number(value).toFixed(2)}</TableCell>;
                } else if (!isSubTableHeader && (isPivotCol && value !== undefined && value)) {
                  let isSelected = selectedKeys.includes(item.key);
                  return forProf ? formatProf(value, isSelected) : formatCourse(value, isSelected);
                } else if (!isSubTableHeader && columnKey === 'enrollment') {
                  return <TableCell>{Math.round(Number(value))}</TableCell>;
                }
                const formattedValue =
                  typeof value === 'number'
                    ? value.toFixed(1)
                    : value ? value : (0.0).toFixed(1);

                return (
                  <TableCell 
                    className={`
                      ${isSubTableHeader ? 'text-xs font-semi-bold text-gray' : ''} 
                      ${idx === 0 ? 'rounded-l-lg pl-8' : ''}
                      ${idx === professorCols.length - 1 ? 'rounded-r-lg' : ''}
                    `}
                  >{formattedValue}</TableCell>
                );
              }}
          </TableRow>
          );
        }}
      </TableBody>
    );
  }, [flattenTree, selectedKeys, reverseMapping]);

  if (!flattenTree()) {
    return <Spinner />;
  }

  return (
    <Table 
      removeWrapper 
      aria-label="Example static collection table" 
      bottomContent={bottomContent}
      sortDescriptor={sortDescriptor}
      onSortChange={setSortDescriptor}
      className="w-800"
      topContent={topContent}
    >
      <TableHeader columns={forProf ? expandableProfColumns : courseCols}>
      {(column) => {
        return (
          <TableColumn 
            key={column.key}
            allowsSorting={column.key !== 'enrollment'}
          >
            {column.key === 'enrollment' ? (
              <div className="flex flex-row gap-2 items-center">
                {column.label}
                <PersonIcon style={{ width: '18px' }}/>
              </div>
            ) : (
              <>{column.label}</>
            )}
          </TableColumn>
        );
      }}
      </TableHeader>
      {memoizedTableBody}
    </Table>
  );
}

export default ExpandableTable;