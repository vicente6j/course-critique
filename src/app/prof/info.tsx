'use client'
import { FC, useMemo } from "react";
import { Prof, useProfs } from "../contexts/server/prof";
import { CompiledProfResponse, ProfResponse } from "./fetch";
import { termOrder } from "../course/history";
import { Link } from "@nextui-org/react";
import { useRouter } from "next/navigation";

export interface ProfInfoProps {
  profInfo: Prof | null;
  compiledResponse: CompiledProfResponse | null;
}

const Info: FC<ProfInfoProps> = ({
  profInfo,
  compiledResponse,
}: ProfInfoProps) => {

  const router = useRouter();

  const sortedTerms: string[] = useMemo(() => {
    if (!compiledResponse || !compiledResponse.terms) {
      return [];
    }
    return Array.from(compiledResponse!.terms).sort((a, b) => {
      const [termA, yearA] = a.split(" ");
      const [termB, yearB] = b.split(" ");

      if (yearA !== yearB) {
        return parseInt(yearB) - parseInt(yearA);
      }
      return termOrder[termB] - termOrder[termA];
    })
  }, [compiledResponse!.terms]);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-[auto_1fr] gap-y-4 gap-x-8 text-sm">
        <p>List of courses taught</p>
        <div className="flex flex-row flex-wrap gap-4 gap-y-2">
          {Array.from(compiledResponse!.course_ids).map((courseId: string) => (
            <span className="text-sm">{courseId}</span>
          ))}
        </div>

        <p>List of terms</p>
        <div className="flex flex-row gap-4">
          {sortedTerms.map((term: string) => (
            <span key={term}>{term}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Info;