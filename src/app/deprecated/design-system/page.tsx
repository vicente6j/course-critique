"use client"

import { FC, useEffect, useState } from "react"
import ColorSquare from "./colorSquare";
import { Button } from "@nextui-org/button";
import { Link } from "@nextui-org/react";
import FlexRow from "./flexRow";
import FlexCol from "./flexCol";

interface DesignSystemProps {}

const DesignSystem: FC<DesignSystemProps> = ({

}: DesignSystemProps) => {
  return (
    <div className="spacing-lg">
      <FlexRow>
        <Link href='/' color='primary'>
          Go back to home
        </Link>
      </FlexRow>
      <FlexRow marginTop='mt-8'>
        <h1 className="heading-md w-200">Components</h1>
        <FlexCol>
          {/* <ProfessorOrCourseTable rows={professorRows} forProf={true} /> */}
        </FlexCol>
      </FlexRow>
      <FlexRow marginTop="mt-8">
        <h1 className="heading-md w-200">Buttons</h1>
        <Button 
          onClick={() => console.log("example")}
          color="primary"
        >
          Primary
        </Button>
        <Button 
          onClick={() => console.log("example")}
          color="secondary"
        >
          Secondary
        </Button>
        <Button 
          onClick={() => console.log("example")}
          color="success"
        >
          Success
        </Button>
      </FlexRow>
      <FlexRow alignItems="items-start" marginTop="mt-8">
        <h1 className="heading-md w-200">Headings</h1>
        <div>
          <h1 className="heading-sm">
            Hello world
          </h1>
          <h1 className="heading-md">
            Hello world
          </h1>
          <h1 className="heading-lg">
            Hello world
          </h1>
          <h1 className="heading-xl">
            Hello world
          </h1>
          <h1 className="heading-2xl">
            Hello world
          </h1>
        </div>
      </FlexRow>
      <FlexRow alignItems="items-start" marginTop="mt-8">
        <h1 className="heading-md w-200">Text</h1>
        <FlexCol>
          <p className="text-sm">
            George P. Burdell is a fictitious student officially enrolled at Georgia Tech in 1927 as a 
            practical joke. Since then, he has supposedly received all undergraduate degrees offered by 
            Georgia Tech, served in the military, gotten married, and served on Mad Magazine's Board of 
            Directors, among other accomplishments.
          </p>
          <p className="text-md">
            George P. Burdell is a fictitious student officially enrolled at Georgia Tech in 1927 as a 
            practical joke. Since then, he has supposedly received all undergraduate degrees offered by 
            Georgia Tech, served in the military, gotten married, and served on Mad Magazine's Board of 
            Directors, among other accomplishments.
          </p>
          <p className="text-lg">
            George P. Burdell is a fictitious student officially enrolled at Georgia Tech in 1927 as a 
            practical joke. Since then, he has supposedly received all undergraduate degrees offered by 
            Georgia Tech, served in the military, gotten married, and served on Mad Magazine's Board of 
            Directors, among other accomplishments.
          </p>
          <p className="text-xl">
            George P. Burdell is a fictitious student officially enrolled at Georgia Tech in 1927 as a 
            practical joke. Since then, he has supposedly received all undergraduate degrees offered by 
            Georgia Tech, served in the military, gotten married, and served on Mad Magazine's Board of 
            Directors, among other accomplishments.
          </p>
        </FlexCol>
      </FlexRow>
      <FlexRow alignItems="items-start" marginTop="mt-8">
        <h1 className="heading-md w-200">Colors</h1>
        <FlexRow flexWrap="flex-wrap">
          <ColorSquare bgColor="bg-dark"/>
          <ColorSquare bgColor="bg-light-dark"/>
          <ColorSquare bgColor="bg-lighter-dark"/>
          <ColorSquare bgColor="bg-lightest-dark"/>
          <ColorSquare bgColor="bg-light"/>
          <ColorSquare bgColor="bg-dark-light"/>
          <ColorSquare bgColor="bg-gray"/>
          <ColorSquare bgColor="bg-link"/>
          <ColorSquare bgColor="bg-yellow"/>
          <ColorSquare bgColor="bg-light-green"/>
          <ColorSquare bgColor="bg-dark-green"/>
          <ColorSquare bgColor="bg-light-blue"/>
          <ColorSquare bgColor="bg-dark-blue"/>
          <ColorSquare bgColor="bg-cyan"/>
          <ColorSquare bgColor="bg-red"/>
        </FlexRow>
      </FlexRow>
    </div>
  )
}

export default DesignSystem;