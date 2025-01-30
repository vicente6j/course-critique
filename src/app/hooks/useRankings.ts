import { useCallback, useMemo, useState } from "react";
import { termToSortableInteger } from "../home/averageOverTime";
import { TERMS_WITH_DATA } from "../metadata";

interface UseRankingsValue {
  tabs: RankingsPageTab[];
}

export interface RankingsPageTab {
  id: string;
  label: string;
}

export const useRankings = (): UseRankingsValue => {

  const tabs: RankingsPageTab[] = useMemo(() => {
    const tabs: RankingsPageTab[] = [];
    for (const term of TERMS_WITH_DATA) {
      tabs.push({
        id: term,
        label: term,
      });
    }
    tabs.sort((a, b) => termToSortableInteger(b.id) - termToSortableInteger(a.id));
    return tabs;
  }, []);

  return {
    tabs
  };
};