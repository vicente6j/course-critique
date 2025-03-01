import { useProfile, UseProfileValue } from "@/app/hooks/useProfile";
import { createContext, FC, useContext } from "react";

const ProfileContext = createContext<UseProfileValue | undefined>(undefined);

interface ProfileContextProviderProps {
  children: React.ReactNode;
}

export const ProfileContextProvider: FC<ProfileContextProviderProps> = ({
  children,
}: ProfileContextProviderProps) => {
  
  const profile = useProfile();

  return (
    <ProfileContext.Provider value={profile}>
      {children}
    </ProfileContext.Provider>
  );
}

export const useProfileContext = (): UseProfileValue => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfileContext must be used within a ProfileContextProvider');
  }
  return context;
}