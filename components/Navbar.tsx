
import React, { useState } from 'react';
import { Project, TeamMember, AppNotification, User } from '../types';
import { SearchBar } from './SearchBar';
import { NotificationsDropdown } from './NotificationsDropdown';
import { AccountMenu } from './AccountMenu';

interface NavbarProps {
  user: User;
  onToggleSidebar: () => void;
  projects: Project[];
  team: TeamMember[];
  notifications: AppNotification[];
  onClearNotifications: () => void;
  onSearchResultSelect: (type: 'PROJECT' | 'TEAM', id: string) => void;
  darkMode: boolean;
  toggleTheme: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  user,
  onToggleSidebar, 
  projects, 
  team, 
  notifications, 
  onClearNotifications,
  onSearchResultSelect,
  darkMode,
  toggleTheme,
  onLogout
}) => {
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 transition-colors duration-200">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-4">
            {/* Mobile menu button */}
            <button
              onClick={onToggleSidebar}
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 md:hidden"
              aria-controls="mobile-menu"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Logo (Visible on desktop if sidebar is collapsed, or just generally useful) */}
            <div className="hidden md:flex items-center gap-2">
               {/* Optional: Breadcrumbs or Page Title could go here */}
            </div>
          </div>

          {/* Desktop Search */}
          <div className="flex-1 flex items-center justify-center px-2 lg:ml-6 lg:justify-end">
            <div className="max-w-lg w-full lg:max-w-xs">
              <label htmlFor="search" className="sr-only">Search</label>
              <SearchBar projects={projects} team={team} onSelectResult={onSearchResultSelect} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Mobile Search Icon */}
            <button 
              onClick={() => setMobileSearchOpen(true)}
              className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full md:hidden"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </button>

            {/* Notifications */}
            <NotificationsDropdown notifications={notifications} onClear={onClearNotifications} />

            {/* Account Menu */}
            <AccountMenu user={user} darkMode={darkMode} toggleTheme={toggleTheme} onLogout={onLogout} />
          </div>
        </div>
      </div>

      {/* Mobile Search Modal Overlay */}
      {mobileSearchOpen && (
        <div className="absolute inset-0 bg-white dark:bg-slate-900 z-50 p-4 flex flex-col md:hidden animate-fade-in">
           <div className="flex items-center gap-2 mb-4">
              <div className="flex-1 relative">
                 <input 
                   type="text" 
                   autoFocus
                   placeholder="Search..." 
                   className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
                   // Reusing SearchBar logic would be better but keeping simple for overlay demo
                 />
                 <svg className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              <button onClick={() => setMobileSearchOpen(false)} className="text-slate-500 dark:text-slate-400 font-medium">Cancel</button>
           </div>
           <div className="flex-1 overflow-y-auto">
             {/* Mobile search results would go here */}
             <p className="text-center text-slate-400 text-sm mt-4">Type to search projects and team.</p>
           </div>
        </div>
      )}
    </nav>
  );
};
