'use client'
import { usePathname, useSearchParams } from "next/navigation";
import { FC, useEffect, useRef, useState } from "react";

export interface LoadingBarProps {
  disableOnRefresh?: boolean;
}

const LoadingBar: FC<LoadingBarProps> = ({
  disableOnRefresh = false,
}: LoadingBarProps) => {

  const [loading, setLoading] = useState<boolean>(false);

  const pathName = usePathname();
  const searchParams = useSearchParams();

  const devModeStopRef = useRef<boolean>(true);

  useEffect(() => {

    const hasReloaded = localStorage.getItem('hasReloaded');
    if (!hasReloaded || hasReloaded === 'false' && disableOnRefresh) {
      return;
    }

    if (process.env.NEXT_PUBLIC_IN_DEV_MODE) {
      if (devModeStopRef.current) {
        devModeStopRef.current = false;
        return;
      }
    }

    setLoading(true);
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 500);

    return () => clearTimeout(timeout);
  }, [pathName, searchParams]);

  if (!loading) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 h-1 z-50">
      <div className="h-full bg-blue-500 w-full animate-spanRight"/>
    </div>
  );
}

export default LoadingBar;