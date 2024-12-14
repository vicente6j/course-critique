'use client'
import { FC, useCallback, useEffect, useState } from "react";
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

export interface RankingsTableColumn {
  key: string;
  label: string;
}

export const columns: RankingsTableColumn[] = [
  { key: "rank", label: "Rank", },
  { key: "course_id", label: "Course ID", },
  { key: "course_name", label: "Course Name", },
  { key: "GPA", label: "Average GPA", },
];

export interface RankingsTableRow {
  key: string;
  [key: string]: number | string;
}

export interface RankingsTableProps {
  rows: RankingsTableRow[];
}

const RankingsTable: FC<RankingsTableProps> = ({
  rows,
}: RankingsTableProps) => {
  
  const router = useRouter();

  return (
    <Table removeWrapper aria-label="Example static collection table" className="w-600">
      <TableHeader columns={columns}>
        {(column) => <TableColumn key={column.key}>{column.label}</TableColumn>}
      </TableHeader>
      <TableBody items={rows}>
        {(item) => (
          <TableRow key={item.key} className="border-b border-gray-200">
            {(columnKey) => {
              const value = getKeyValue(item, columnKey);
              if (columnKey === 'GPA' && value !== undefined && value !== null) {
                let color = formatGPA(Number(value));
                return <TableCell style={{ color: color }} className="font-semibold">{Number(value).toFixed(2)}</TableCell>;
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
              }
              const formattedValue =
                typeof value === 'number'
                  ? value
                  : value ? value : (0.0).toFixed(1);

              return <TableCell className={`${typeof formattedValue === "number" ? 'pl-5' : ''}`}>{formattedValue}</TableCell>;
            }}
          </TableRow>
        )}
      </TableBody>
    </Table>
  )
}

export default RankingsTable;