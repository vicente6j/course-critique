'use client'
import { FC, useMemo } from "react";
import { CompiledResponse, CourseInfo } from "./fetch";
import { termOrder } from "./history";
import { useProfs } from "../contexts/prof/provider";

export interface InfoProps {
  courseInfo: CourseInfo | null;
  compiledResponse: CompiledResponse | null;
  fetchLoading: boolean;
}

const Info: FC<InfoProps> = ({
  courseInfo,
  compiledResponse,
  fetchLoading,
}: InfoProps) => {

  const { profsMap } = useProfs();

  if (fetchLoading || !courseInfo) {
    return <></>;
  }

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
        <p>Course description</p>
        <div className="flex flex-row gap-4 flex-wrap">
          <p>{courseInfo?.description}</p>
        </div>

        <p>Last updated</p>
        <p>{courseInfo?.last_updated}</p>

        <p>List of instructors</p>
        <div className="flex flex-row flex-wrap gap-4 gap-y-2">
          {Array.from(compiledResponse!.instructor_ids).map((profId: string) => (
            <span key={profId}>{profsMap?.get(profId)!.instructor_name} </span>
          ))}
        </div>

        <p>List of terms</p>
        <div className="flex flex-row gap-4 flex-wrap">
          {sortedTerms.map((term: string) => (
            <span key={term}>{term}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Info;