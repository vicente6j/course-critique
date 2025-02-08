'use client';

import { FC } from "react";
import { RankingsContextProvider } from "../client-contexts/rankingsContext";
import HomePage from "./homePage";

export interface HomePageWrapperProps {}

/**
 * The dank thing about this wrapper is (as far as I know) it must exist
 * on the client, since trying to place it on a server level component (e.g. I tried to put this
 * inside the generic root page.tsx file) throws errors, since the rankings context 
 * CONSUMES the course context. Therefore it necessitates that everything in rankings context
 * provider live in a client component, since the course context which gets consumed is also
 * a client level component.
 * @param param0 
 * @returns HomePage
 */
const HomePageWrapper: FC<HomePageWrapperProps> = ({

}: HomePageWrapperProps) => {

  return (
    <RankingsContextProvider>
      <HomePage />
    </RankingsContextProvider>
  );
}

export default HomePageWrapper;