import React, { useState, useRef, useEffect } from 'react';
import { useTheme, Theme } from '../../contexts/ThemeContext';
import { Sun, Moon, Palette } from 'lucide-react'; // Removed Building2

const themeOptions: { name: Theme; icon: React.ReactNode }[] = [
  { name: 'light', icon: <Sun size={18} /> },
  { name: 'dark', icon: <Moon size={18} /> },
  // Removed 'corporate' theme option
];

const ThemeSwitcher: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = () => setIsOpen(!isOpen);

  const handleThemeChange = (selectedTheme: Theme) => {
    setTheme(selectedTheme);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        aria-label="Change theme"
        title="Change theme"
        className="p-2 rounded-md hover:bg-[var(--color-background-secondary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
      >
        <Palette size={20} />
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 bg-[var(--color-background-card-opaque)] rounded-md shadow-[var(--color-shadow-card)] py-1 z-50 border border-[var(--color-border-secondary)]">
          {themeOptions.map((option) => (
            <button
              key={option.name}
              onClick={() => handleThemeChange(option.name)}
              className={`w-full flex items-center px-3 py-2 text-sm text-left transition-colors
                ${theme === option.name 
                  ? 'bg-[var(--color-text-accent)] text-[var(--color-text-on-accent)]' 
                  : 'text-[var(--color-text-primary)] hover:bg-[var(--color-background-secondary)]'}
              `}
            >
              <span className="mr-2">{option.icon}</span>
              {option.name.charAt(0).toUpperCase() + option.name.slice(1)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ThemeSwitcher;