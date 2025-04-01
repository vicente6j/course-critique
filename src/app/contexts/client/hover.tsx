'use client'
import { createContext, Dispatch, FC, SetStateAction, useCallback, useContext, useEffect, useMemo, useState } from "react";

export interface HoverContextValue {
  aboveDropdown: boolean | null;
  setAboveDropdown: Dispatch<SetStateAction<boolean | null>>;
}

const HoverContext = createContext<HoverContextValue | undefined>(undefined);

export interface HoverContextProviderProps {
  children: React.ReactNode;
}

const HoverContextProvider: FC<HoverContextProviderProps> = ({
  children
}: HoverContextProviderProps) => {

  const [aboveDropdown, setAboveDropdown] = useState<boolean | null>(null);

  const contextValue: HoverContextValue = useMemo(() => ({
    aboveDropdown,
    setAboveDropdown
  }), [aboveDropdown]);

  return (
    <HoverContext.Provider value={contextValue}>
      {children}
    </HoverContext.Provider>
  )
}

export const useHoverContext: () => HoverContextValue = () => {
  const context = useContext(HoverContext);
  if (context === undefined) {
    throw new Error('useHoverContext must be used within a HoverContextProvider');
  }
  return context;
}

export default HoverContextProvider;