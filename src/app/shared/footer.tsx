import { Link } from "@nextui-org/react";
import { FC } from "react";

export interface FooterProps {}

export const Footer: FC<FooterProps> = ({

}: FooterProps) => {
  return (
    <div className="w-full border border-bottom border-gray bg-light z-20">
      <div className="w-[80%] mx-auto py-12">
        <div className="flex flex-row justify-between items-center">
          <div className="flex flex-col">
            <p className="heading-md">Course Critique</p>
            <p className="text-sm">A Georgia Tech project</p>
          </div>
          <div className="flex flex-col w-300 text-end">
            <p className="text-md">Created with ♥ by Vicente Miranda</p>
          </div>
        </div>
      </div>
    </div>
  );
}