import { useUserProfile, UseUserProfileValue } from "@/app/hooks/profile/useProfile";
import { createContext, FC, useContext } from "react";

const ProfileContext = createContext<UseUserProfileValue | undefined>(undefined);

interface ProfileContextProviderProps {
  children: React.ReactNode;
}

export const ProfileContextProvider: FC<ProfileContextProviderProps> = ({
  children,
}: ProfileContextProviderProps) => {
  
  const profile = useUserProfile();

  return (
    <ProfileContext.Provider value={profile}>
      {children}
    </ProfileContext.Provider>
  );
}

export const useProfileContext = (): UseUserProfileValue => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfileContext must be used within a ProfileContextProvider');
  }
  return context;
}