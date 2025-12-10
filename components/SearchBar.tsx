
import React, { useState, useEffect, useRef } from 'react';
import { Project, TeamMember } from '../types';

interface SearchBarProps {
  projects: Project[];
  team: TeamMember[];
  onSelectResult: (type: 'PROJECT' | 'TEAM', id: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ projects, team, onSelectResult }) => {
  const [query, setQuery] = useState('');
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

  const filteredProjects = query ? projects.filter(p => 
    p.name.toLowerCase().includes(query.toLowerCase()) || 
    p.description.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 3) : [];

  const filteredTeam = query ? team.filter(t => 
    t.name.toLowerCase().includes(query.toLowerCase()) ||
    t.role.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 3) : [];

  const hasResults = filteredProjects.length > 0 || filteredTeam.length > 0;

  return (
    <div ref={wrapperRef} className="relative w-full max-w-md hidden md:block">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg leading-5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-500 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors duration-200"
          placeholder="Search projects, tasks, or team..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          role="searchbox"
          aria-label="Search"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        />
      </div>

      {isOpen && query && (
        <div className="absolute mt-1 w-full bg-white dark:bg-slate-800 shadow-lg rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm z-50">
          {!hasResults ? (
            <div className="px-4 py-2 text-slate-500 dark:text-slate-400">No results found.</div>
          ) : (
            <>
              {filteredProjects.length > 0 && (
                <div>
                  <div className="px-3 py-1 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-700/50">Projects</div>
                  {filteredProjects.map(project => (
                    <button
                      key={project.id}
                      onClick={() => {
                        onSelectResult('PROJECT', project.id);
                        setIsOpen(false);
                        setQuery('');
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 group transition-colors"
                    >
                      <div className="w-2 h-2 rounded-full bg-indigo-500 group-hover:scale-125 transition-transform"></div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-slate-100">{project.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[200px]">{project.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              
              {filteredTeam.length > 0 && (
                <div>
                  <div className="px-3 py-1 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-700/50">Team</div>
                  {filteredTeam.map(member => (
                    <button
                      key={member.id}
                      onClick={() => {
                        onSelectResult('TEAM', member.id);
                        setIsOpen(false);
                        setQuery('');
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 transition-colors"
                    >
                      <img src={member.avatar} alt="" className="w-6 h-6 rounded-full" />
                      <div>
                        <p className="font-medium text-slate-900 dark:text-slate-100">{member.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{member.role}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
