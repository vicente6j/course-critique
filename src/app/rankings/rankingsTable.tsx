'use client'
import { FC, useCallback, useEffect, useRef, useState } from "react";
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
import { useProfs } from "../server-contexts/prof/provider";

export interface RankingsTableColumn {
  key: string;
  label: string;
}

export const courseCols: RankingsTableColumn[] = [
  { key: "rank", label: "Rank", },
  { key: "course_id", label: "Course ID", },
  { key: "course_name", label: "Course Name", },
  { key: "GPA", label: "Average GPA", },
  { key: "enrollment", label: "Enrollment", },
];

export const profCols: RankingsTableColumn[] = [
  { key: "rank", label: "Rank", },
  { key: "prof_id", label: "Profesor Name", },
  { key: "courses_taught_this_sem", label: "Course Taught This Semester", },
  { key: "GPA", label: "Average GPA", },
];

export interface RankingsTableRow {
  key: string;
  [key: string]: number | string;
}

export type RankingsTableType = 'prof' | 'course';

export interface RankingsTableProps {
  rows: RankingsTableRow[];
  type: RankingsTableType;
}

const RankingsTable: FC<RankingsTableProps> = ({
  rows,
  type,
}: RankingsTableProps) => {
  
  const router = useRouter();
  const { maps } = useProfs();

  if (type === 'prof') {
    return (
      <Table 
        removeWrapper 
        isStriped
        aria-label="z-0"
      >
        <TableHeader columns={profCols}>
          {(column) => (
            <TableColumn 
              key={column.key}
            >
              {column.label}
            </TableColumn>
          )}
        </TableHeader>
  
        <TableBody items={rows}>
          {(item) => {
            return (
              <TableRow 
                key={item.key} 
                className={`border-b border-gray-200`}
              >
                {(columnKey) => {
                  const value = getKeyValue(item, columnKey);
  
                  if (columnKey === 'GPA' && value !== undefined && value !== null) {
                    const color = formatGPA(Number(value));
                    return (
                      <TableCell 
                        style={{ color: color }} 
                        className="font-semibold"
                      >
                        {Number(value).toFixed(2)}
                      </TableCell>
                    );
                  } else if (columnKey === 'prof_id') {
                    return (
                      <TableCell>
                        <Link 
                          onClick={() => {
                            router.push(`/prof?profID=${value.toString()}`);
                          }}
                          className="text-sm text-gray-600 hover:underline cursor-pointer"
                        >
                          {maps.profs?.get(value)?.instructor_name}
                        </Link>
                      </TableCell>
                    );
                  } else if (columnKey === 'courses_taught_this_sem') {
                    return (
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          {value.map((course: string, idx: number) => (
                            <span>
                              <Link 
                                onClick={() => {
                                  router.push(`/course?courseID=${course.toString()}`);
                                }}
                                className="text-sm text-gray-600 hover:underline cursor-pointer"
                              >
                                {course}
                              </Link>
                            </span>
                          ))}
                        </div>
                      </TableCell>
                    );
                  } else if (columnKey === 'rank') {
                    return (
                      <TableCell
                        className="pl-5"
                      >
                        {value}
                      </TableCell>
                    );
                  }
                  return <TableCell>{''}</TableCell>;
                }}
              </TableRow>
            );
          }}
        </TableBody>
      </Table>
    );
  } else {
    return (
      <Table 
        removeWrapper 
        isStriped
        aria-label="z-0"
      >
        <TableHeader columns={courseCols}>
          {(column) => (
            <TableColumn 
              key={column.key}
            >
              {column.label}
            </TableColumn>
          )}
        </TableHeader>
  
        <TableBody items={rows}>
          {(item) => {
            return (
              <TableRow 
                key={item.key} 
                className={`border-b border-gray-200`}
              >
                {(columnKey) => {
                  const value = getKeyValue(item, columnKey);
  
                  if (columnKey === 'GPA' && value !== undefined && value !== null) {
                    const color = formatGPA(Number(value));
                    return (
                      <TableCell 
                        style={{ color: color }} 
                        className="font-semibold"
                      >
                        {Number(value).toFixed(2)}
                      </TableCell>
                    );
                  } else if (columnKey === 'course_id') {
                    return (
                      <TableCell>
                        <Link 
                          onClick={() => {
                            router.push(`/course?courseID=${value.toString()}`);
                          }}
                          className="text-sm text-gray-600 hover:underline cursor-pointer"
                        >
                          {value}
                        </Link>
                      </TableCell>
                    );
                  } else if (columnKey === 'course_name') {
                    return (
                      <TableCell>
                        {value}
                      </TableCell>
                    );
                  } else if (columnKey === 'rank') {
                    return (
                      <TableCell
                        className="pl-5"
                      >
                        {value}
                      </TableCell>
                    );
                  } else if (columnKey === 'enrollment') {
                    return (
                      <TableCell>
                        {value}
                      </TableCell>
                    );
                  }
                  return <TableCell>{''}</TableCell>
                }}
              </TableRow>
            );
          }}
        </TableBody>
      </Table>
    );
  }
}

export default RankingsTable;