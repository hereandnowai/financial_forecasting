import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { NAV_LINKS, COMPANY_LOGO_URL } from '../../constants';
import { BrainCircuit } from 'lucide-react';
import ThemeSwitcher from '../ui/ThemeSwitcher';

interface HeaderProps {
  appName: string;
}

const Header: React.FC<HeaderProps> = ({ appName }) => {
  const location = useLocation();

  return (
    <header className="bg-[var(--color-background-header)] backdrop-blur-md shadow-[var(--color-shadow-header)] sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3 text-[var(--color-text-primary)] hover:opacity-80 transition-opacity">
            {COMPANY_LOGO_URL ? (
              <img src={COMPANY_LOGO_URL} alt={`${appName} Logo`} className="h-10 w-auto" />
            ) : (
              <BrainCircuit className="h-10 w-10 text-[var(--color-text-accent)]" />
            )}
            <span className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[var(--color-text-logo-gradient-from)] via-[var(--color-text-logo-gradient-via)] to-[var(--color-text-logo-gradient-to)]">{appName}</span>
          </Link>
          <div className="flex items-center space-x-4">
            <nav className="hidden md:flex space-x-2">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors
                    ${location.pathname === link.path 
                      ? 'bg-[var(--color-text-accent)] text-[var(--color-text-on-accent)] shadow-sm' 
                      : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-background-secondary)] hover:text-[var(--color-text-primary)]'
                    }`}
                >
                  {link.name}
                </Link>
              ))}
            </nav>
            <ThemeSwitcher />
          </div>
          {/* Mobile menu button could be added here */}
        </div>
      </div>
    </header>
  );
};

export default Header;