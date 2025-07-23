

import { useEffect } from 'react';
import { useSelector } from 'react-redux';

export default function ThemeProvider({ children }) {
  const { theme } = useSelector((state) => state.theme);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return (
    <div className='bg-rgb(241,245,241) text-black dark:text-white dark:bg-[rgb(16,23,42)] min-h-screen'>
      {children}
    </div>
  );
}