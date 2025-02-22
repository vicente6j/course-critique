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
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import RemoveIcon from '@mui/icons-material/Remove';
import { tailwindConversion } from "../utils";

export interface RankingsTableColumn {
  key: string;
  label: string;
  width: string;
}

export const courseCols: RankingsTableColumn[] = [
  { key: "rank", label: "Rank", width: 'w-[10%]' },
  { key: "course_id", label: "Course ID", width: 'w-[15%]' },
  { key: "course_name", label: "Course Name", width: 'w-[55%]' },
  { key: "GPA", label: "Average GPA", width: 'w-[20%]' },
];

export const profCols: RankingsTableColumn[] = [
  { key: "rank", label: "Rank", width: 'w-[10%]' },
  { key: "prof_id", label: "Profesor Name", width: 'w-[20%]' },
  { key: "courses_taught", label: "Course Taught This Semester", width: 'w-[50%]' },
  { key: "GPA", label: "Average GPA", width: 'w-[20%]' },
];

export interface RankingsTableRow {
  key: string;
  [key: string]: number | string | null;
}

export type RankingsTableType = 'prof' | 'course';

export interface RankingsTableProps {
  rows: RankingsTableRow[];
  type: RankingsTableType;
  showDifferential?: boolean;
}

const RankingsTable: FC<RankingsTableProps> = ({
  rows,
  showDifferential,
  type,
}: RankingsTableProps) => {
  
  const router = useRouter();
  const { 
    maps 
  } = useProfs();

  const rankCell: (rank: number, rankingDiff: number | null) => any = useCallback((rank, rankingDiff) => {
    return (
      <TableCell className="text-left pl-5">
        {showDifferential ? (
          <div className="flex flex-row gap-2 items-center">
            {rank}
            <div className="flex items-center">
              {rankingDiff === null ? (
                <p className="text-xs text-gray-800 px-2 py-1 rounded-lg bg-gray-200">
                  NEW
                </p>
              ) : rankingDiff < 0 ? (
                <ArrowUpwardIcon 
                  style={{
                    color: tailwindConversion['text-green-500'],
                    width: '16px',
                  }}
                />
              ) : rankingDiff > 0 ? (
                <ArrowDownwardIcon 
                  style={{
                    color: tailwindConversion['text-red-500'],
                    width: '16px'
                  }}
                />
              ) : (
                <RemoveIcon
                  style={{
                    color: '#666',
                    width: '16px'
                  }}
                />
              )}
              {rankingDiff !== null && (
                <p 
                  className={`${rankingDiff < 0 
                    ? 'text-green-500' : rankingDiff > 0 
                    ? 'text-red-500' : 'text-gray-500'}
                    text-sm
                  `}
                >
                  {Math.abs(rankingDiff)}
                </p>
              )}
            </div>
          </div>
        ) : (
          <>{rank}</>
        )}
      </TableCell>
    );
  }, []);

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
              className={`${column.width}`}
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
                  } else if (columnKey === 'courses_taught') {
                    return (
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          {value.map((course: string, idx: number) => (
                            <span key={idx}>
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
                    const rankingDiff = item['rankingDifferential'] === null ? null : item['rankingDifferential'] as number;
                    return rankCell(value, rankingDiff);
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
              className={`${column.width}`}
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
                    const rankingDiff = item['rankingDifferential'] === null ? null : item['rankingDifferential'] as number;
                    return rankCell(value, rankingDiff);
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