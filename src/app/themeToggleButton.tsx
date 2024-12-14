'use client'

import { Button } from "@nextui-org/button";
import { FC, useCallback, useEffect, useState } from "react";
interface ThemeToggleButtonProps {
  color?: string;
}

const ThemeToggleButton: FC<ThemeToggleButtonProps> = ({
  color,
}: ThemeToggleButtonProps) => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  const toggleTheme: () => void = useCallback(() => {
    setIsDarkMode((prev: boolean) => !prev);
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  return (
    <Button 
      variant="ghost" 
      onClick={toggleTheme} 
      size="sm" 
      className="border border-white white hover:border-gray-400 font-semi-bold transition-colors duration-300"
    >
      Change theme
    </Button>
  )
}

export default ThemeToggleButton;