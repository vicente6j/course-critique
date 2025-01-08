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
import PersonIcon from '@mui/icons-material/Person';

export interface GradeTableColumn {
  key: string;
  label: string;
}

export const columns: GradeTableColumn[] = [
  { key: "GPA", label: "Average GPA", },
  { key: "A", label: "A", },
  { key: "B", label: "B", },
  { key: "C", label: "C", },
  { key: "D", label: "D", },
  { key: "F", label: "F", },
  { key: "W", label: "W", },
];

export const termColumns: GradeTableColumn[] = [
  ...columns,
  { key: 'enrollment', label: 'Enrollment' }
];

export const expandableProfColumns: GradeTableColumn[] = [
  { key: "professor", label: "Professor" },
  { key: "GPA", label: "Average GPA", },
  { key: "A", label: "A", },
  { key: "B", label: "B", },
  { key: "C", label: "C", },
  { key: "D", label: "D", },
  { key: "F", label: "F", },
  { key: "W", label: "W", },
  { key: 'enrollment', label: 'Enrollment' },
];

export interface GradeTableRow {
  key: string;
  [key: string]: number | string;
}

export interface TableProps {
  rows: GradeTableRow[];
  forTerm: boolean;
}

export const formatGPA: (gpa: number) => string = (gpa: number) => {
  let color = 'var(--foreground-rgb)';
  if (gpa > 3.5 && gpa <= 4.0) {
    color = 'var(--color-dark-green)';
  } else if (gpa > 3.0 && gpa <= 3.5) {
    color = 'var(--color-light-green)';
  } else if (gpa > 2.5 && gpa <= 3.0) {
    color = 'var(--color-yellow)';
  } else {
    color = 'var(--color-red)';
  }
  return color;
}

export const gradeColorDictHex: Record<string, string> = {
  'A': '#168921',
  'B': '#11AF22',
  'C': '#FCB400',
  'D': '#FF9999',
  'F': '#FE466C',
  'W': '#666666',
};

const GradeTable: FC<TableProps> = ({
  rows,
  forTerm,
}: TableProps) => {

  return (
    <Table removeWrapper aria-label="Example static collection table" className="w-600">
      <TableHeader columns={forTerm ? termColumns : columns}>
      {(column) => {
        return (
          <TableColumn 
            key={column.key}
            className="mix-blend-mode-multiply"
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
      <TableBody items={rows}>
        {(item) => (
          <TableRow key={item.key} className="border-b border-gray-200">
            {(columnKey) => {
              const value = getKeyValue(item, columnKey);
              if (columnKey === 'GPA' && value !== undefined && value !== null) {
                let color = formatGPA(Number(value));
                return <TableCell style={{ color: color }} className="font-semibold">{Number(value).toFixed(2)}</TableCell>;
              } else if (columnKey === 'enrollment') {
                return (
                  <TableCell>{Math.round(Number(value))}</TableCell>
                );
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
  )
}

export default GradeTable;