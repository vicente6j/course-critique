import { FC } from "react";
import { CourseInfo, RelatedCourse } from "./fetch";
import { Link } from "@nextui-org/react";
import { formatGPA } from "../shared/gradeTable";
import { useRouter } from "next/navigation";
import { useCourses } from "../contexts/course/provider";
import {Skeleton} from "@nextui-org/skeleton";

export interface SidePanelProps {
  relatedCourses: RelatedCourse[] | null;
  courseInfo: CourseInfo;
  fetchLoading: boolean | null;
}

export const SidePanel: FC<SidePanelProps> = ({
  relatedCourses,
  courseInfo,
  fetchLoading
}: SidePanelProps) => {
  
  const router = useRouter();
  const { courseMap, averagesMap } = useCourses();

  const FormattedGPA: FC<{ rel: RelatedCourse }> = ({ rel }) => {
    if (!averagesMap?.has(rel.course_two)) {
      return <span className="flex-shrink-0 inline text-gray-400">N/A</span>;
    }
    const gpa = Number(averagesMap?.get(rel.course_two)?.GPA);
    const color = formatGPA(gpa);
    return (
      <span className="flex-shrink-0 inline" style={{ color: color }}>{gpa.toFixed(2)}</span>
    );
  };

  return (
    <div className="flex flex-col gap-4 flex-shrink-0 w-[22%]">
      <div className="bg-white p-8 rounded-md shadow-sm h-fit">
        <p className="heading-sm mb-4">Related to {courseInfo?.id}</p>
          <div className="flex flex-col gap-4">
            {relatedCourses === null || relatedCourses === undefined || fetchLoading ? (
              Array(5).fill(null).map((_, index) => {
                return (
                  <Skeleton>
                    <div className="flex flex-col gap-0 h-12">
                      <div className="h-5 w-3/4"></div>
                      <div className="h-4 w-full"></div>
                    </div>
                  </Skeleton>
                )
              })
            ) : (
              relatedCourses?.map((rel: RelatedCourse) => {
                return (
                  <div key={rel.course_two} className="flex flex-col gap-0">
                    <Link 
                      onClick={() => {
                        router.push(`/course?courseID=${rel.course_two}`);
                      }}
                      className="text-sm hover:underline cursor-pointer"
                    >
                      {rel.course_two}
                    </Link>
                    <span className="w-fit text-xs text-gray-500">
                      {courseMap?.get(rel.course_two)?.course_name} • {courseMap?.get(rel.course_two)?.credits} • <FormattedGPA rel={rel} />
                    </span>
                  </div>
                );
              })
            )} 
          </div>
      </div>
      <div className="bg-white p-8 rounded-md shadow-sm h-fit">
        <p className="heading-sm mb-4">Other Resources</p>
        <div className="flex flex-col gap-4">
          <a href="https://catalog.gatech.edu/coursesaz/" className="text-sm text-gray-500 pl-2 hover:underline" target="_blank">Course Catalog</a>
          <a href="https://gatech.smartevals.com/" className="text-sm text-gray-500 pl-2 hover:underline" target="_blank">CIOS Results</a>
        </div>
      </div>
    </div>
  );
}

export default SidePanel;