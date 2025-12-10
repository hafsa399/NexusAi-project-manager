
import React, { useState, useRef, useEffect } from 'react';
import { User } from '../types';

interface AccountMenuProps {
  user: User;
  darkMode: boolean;
  toggleTheme: () => void;
  onLogout: () => void;
}

export const AccountMenu: React.FC<AccountMenuProps> = ({ user, darkMode, toggleTheme, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getInitials = (name: string) => {
      return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div ref={wrapperRef} className="relative ml-3">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 max-w-xs bg-white dark:bg-slate-800 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 p-1 pr-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        id="user-menu-button"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span className="sr-only">Open user menu</span>
        {user.avatar ? (
             <img src={user.avatar} alt={user.name} className="h-8 w-8 rounded-full object-cover bg-slate-200" />
        ) : (
            <div className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-xs">{getInitials(user.name)}</div>
        )}
        
        <span className="hidden md:block text-sm font-medium text-slate-700 dark:text-slate-200">{user.name}</span>
        <svg className={`hidden md:block w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div
          className="origin-top-right absolute right-0 mt-2 w-56 rounded-xl shadow-lg py-1 bg-white dark:bg-slate-800 ring-1 ring-black ring-opacity-5 focus:outline-none z-50 animate-fade-in border border-slate-100 dark:border-slate-700"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="user-menu-button"
          tabIndex={-1}
        >
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
             <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user.name}</p>
             <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
             <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800">
                {user.role}
             </span>
          </div>
          
          <div className="py-1">
            <a href="#" className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50" role="menuitem">Your Profile</a>
            <a href="#" className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50" role="menuitem">Account Settings</a>
          </div>
          
          <div className="border-t border-slate-100 dark:border-slate-700 py-1">
            <button 
                onClick={toggleTheme}
                className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center justify-between" 
                role="menuitem"
            >
                <span>Appearance</span>
                <div className="flex items-center gap-2">
                {darkMode ? (
                    <span className="text-xs bg-slate-700 text-yellow-400 px-1.5 py-0.5 rounded flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                    Light
                    </span>
                ) : (
                    <span className="text-xs bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                    Dark
                    </span>
                )}
                </div>
            </button>
          </div>
          
          <div className="border-t border-slate-100 dark:border-slate-700 py-1">
            <button 
                onClick={onLogout}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2" 
                role="menuitem"
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
