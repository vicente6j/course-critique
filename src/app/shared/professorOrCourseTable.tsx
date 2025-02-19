'use client'
import { FC, useCallback, useMemo, useState } from "react";
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
  Button,
  getKeyValue,
  Spinner,
  Link,
} from "@nextui-org/react";
import { SearchIcon } from "../../../public/icons/searchIcon";
import { useAsyncList } from "@react-stately/data";
import FlexCol from "../deprecated/design-system/flexCol";
import { formatGPA, GradeTableColumn, GradeTableRow } from "./gradeTable";
import { useRouter } from "next/navigation";
import { useProfs } from "../server-contexts/prof/provider";
import CustomSearchBar from "./customSearchbar";

export const professorCols: GradeTableColumn[] = [
  { key: "professor", label: "Professor", },
  { key: "GPA", label: "Average GPA", },
  { key: "A", label: "A", },
  { key: "B", label: "B", },
  { key: "C", label: "C", },
  { key: "D", label: "D", },
  { key: "F", label: "F", },
  { key: "W", label: "W", },
];

export const courseCols: GradeTableColumn[] = [
  { key: "course_id", label: "Course", },
  { key: "GPA", label: "Average GPA", },
  { key: "A", label: "A", },
  { key: "B", label: "B", },
  { key: "C", label: "C", },
  { key: "D", label: "D", },
  { key: "F", label: "F", },
  { key: "W", label: "W", },
];

export interface ProfessorOrCourseTableProps {
  forProf: boolean;
  rows: GradeTableRow[];
}

const ProfessorOrCourseTable: FC<ProfessorOrCourseTableProps> = ({
  forProf,
  rows,
}: ProfessorOrCourseTableProps) => {

  const [searchValue, setSearchValue] = useState<string>("");
  const [rowsPerPage, setRowsPerPage] = useState<number>(5);
  const [page, setPage] = useState<number>(1);

  const router = useRouter();
  /** 
   * Need to use profsMap, since course IDs are the way to uniquely identify
   * a given course, but for professor professor IDs isn't particularly indicative,
   * so we fetch their full name instead (given their ID).
   */
  const { maps } = useProfs();

  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: forProf ? 'professor' : 'course_id',
    direction: "ascending",
  });

  const numPages = Math.ceil(rows.length / rowsPerPage);

  const filteredItems: GradeTableRow[] = useMemo(() => {
    if (!searchValue || searchValue === '') {
      return [...rows];
    }
    return [...rows].filter(row => {
      return forProf ? maps.profs!.get(row.professor as string)?.instructor_name.toString().toLowerCase().includes(searchValue.toLowerCase())
        : (row.course_id as string).toLowerCase().includes(searchValue.toLowerCase());
      }
    );
  }, [searchValue, rows]);

  const sortedItems: GradeTableRow[] = useMemo(() => {
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

  const formatProf: (profId: string) => JSX.Element = useCallback((profId: string) => {
    return (
      <TableCell>
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

  const formatCourse: (courseId: string) => JSX.Element = useCallback((courseId: string) => {
    return (
      <TableCell>
         <Link 
            onClick={() => {
              router.push(`/course?courseID=${encodeURIComponent(courseId)}`);
            }}
            className="text-sm hover:underline cursor-pointer"
          >
            {courseId}
          </Link>
      </TableCell>
    );
  }, []);

  const onSearchChange: (value: string) => void = useCallback((value) => {
    setSearchValue(value);
    setPage(1);
  }, []);

  const onClear: () => void = useCallback(() => {
    setSearchValue("");
    setPage(1);
  }, []);

  const onRowsPerPageChange: (e: any) => void = useCallback((e: any) => {
    setRowsPerPage(Number(e.target.value));
    setPage(1);
  }, []);

  const topContent: React.ReactNode = useMemo(() => {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-row justify-between gap-3 items-end">
          {rows.length > rowsPerPage && (
            <CustomSearchBar
              searchValue={searchValue}
              onClear={onClear}
              onSearchChange={onSearchChange}
              variation={'regular'}
              searchString={`Search for a ${forProf ? 'professor...' : 'course ID...'}`}
            />
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
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="15">15</option>
            </select>
          </label>
        </div>
      </div>
    )
  }, [searchValue, onSearchChange, onClear, filteredItems, rowsPerPage]);

  const bottomContent: React.ReactNode = useMemo(() => {
    if (filteredItems.length < rowsPerPage) {
      return <></>;
    }
    return (
      <div className="py-2 px-2 flex justify-center items-center">
        <Pagination
          disableAnimation
          variant="bordered"
          isCompact
          showControls
          showShadow
          color="default"
          page={page}
          total={numPages}
          onChange={(page) => setPage(page)}
          classNames={{
            wrapper: '',
            item: 'border-none data-[active=true]:bg-default-100 shadow-none data-[active=true]:shadow-none',
            prev: 'shadow-none',
            next: 'shadow-none'
          }}
        />
      </div>
    );
  }, [page, numPages, filteredItems]);

  return (
    <div className="overflow-hidden">
      <Table 
        removeWrapper 
        aria-label="Example static collection table" 
        bottomContent={bottomContent}
        sortDescriptor={sortDescriptor}
        onSortChange={setSortDescriptor}
        className="max-w-800"
        topContent={topContent}
      >
        <TableHeader columns={forProf ? professorCols : courseCols}>
          {(column) => <TableColumn key={column.key} allowsSorting>{column.label}</TableColumn>}
        </TableHeader>
        <TableBody emptyContent="No data found" items={slicedItems}>
          {(item) => (
            <TableRow key={item.key} className="border-b border-gray-200">
              {(columnKey) => {
                const value = getKeyValue(item, columnKey);
                if (columnKey === 'GPA' && value !== undefined && value !== null) {
                  let color = formatGPA(Number(value));
                  return <TableCell style={{ color: color }} className="font-semibold">{Number(value).toFixed(2)}</TableCell>;
                } else if (columnKey === 'professor' && value !== undefined && value) {
                  return formatProf(value);
                } else if (columnKey === 'course_id' && value !== undefined && value) {
                  return formatCourse(value);
                }
                const formattedValue =
                  typeof value === 'number'
                    ? value.toFixed(1)
                    : value ? value : (0.0).toFixed(1);

                return <TableCell>{formattedValue}</TableCell>;
              }}
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export default ProfessorOrCourseTable;