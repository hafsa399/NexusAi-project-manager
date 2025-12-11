
import React from 'react';
import { Project, ViewState } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  view: ViewState;
  setView: (view: ViewState) => void;
  activeProjects: Project[];
  selectedProjectId: string | null;
  onSelectProject: (id: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  collapsed,
  onToggleCollapse,
  view,
  setView,
  activeProjects,
  selectedProjectId,
  onSelectProject
}) => {
  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={`fixed inset-0 bg-slate-900/50 z-40 md:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside 
        className={`
          fixed inset-y-0 left-0 z-50 bg-slate-900 text-slate-300 flex flex-col flex-shrink-0 transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
          ${collapsed ? 'md:w-20' : 'md:w-64'}
          md:relative md:translate-x-0 md:h-full
        `}
        role="navigation"
        aria-label="Main Navigation"
        aria-expanded={isOpen}
      >
        <div className={`p-6 flex items-center ${collapsed ? 'justify-center' : 'justify-between'} h-16`}>
          {!collapsed && (
            <h1 className="text-xl font-bold text-white flex items-center gap-2 animate-fade-in">
              <span className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">N</span>
              NexusAI
            </h1>
          )}
          {collapsed && (
             <span className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-white" aria-label="NexusAI Logo">N</span>
          )}

          {/* Mobile close button */}
          <button 
            onClick={onClose} 
            className="md:hidden text-slate-400 hover:text-white"
            aria-label="Close menu"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          
          {/* Desktop Toggle Button */}
           <button 
            onClick={onToggleCollapse} 
            className="hidden md:block text-slate-500 hover:text-white p-1 rounded transition-transform active:scale-95"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={collapsed ? "M4 6h16M4 12h16M4 18h16" : "M11 19l-7-7 7-7m8 14l-7-7 7-7"} />
            </svg>
          </button>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto custom-scrollbar">
          <button 
            onClick={() => { setView('DASHBOARD'); onClose(); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 active:scale-95 ${view === 'DASHBOARD' ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-slate-800'} ${collapsed ? 'justify-center px-2' : ''}`}
            title="Dashboard"
            aria-label="Dashboard"
            aria-current={view === 'DASHBOARD' ? 'page' : undefined}
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
            {!collapsed && <span>Dashboard</span>}
          </button>
          
          <button 
            onClick={() => { setView('CREATE_PROJECT'); onClose(); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 active:scale-95 ${view === 'CREATE_PROJECT' ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-slate-800'} ${collapsed ? 'justify-center px-2' : ''}`}
             title="New Project"
             aria-label="New Project"
             aria-current={view === 'CREATE_PROJECT' ? 'page' : undefined}
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            {!collapsed && <span>New Project</span>}
          </button>

          <button 
             onClick={() => { setView('TEAM_MANAGEMENT'); onClose(); }}
             className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 active:scale-95 ${view === 'TEAM_MANAGEMENT' ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-slate-800'} ${collapsed ? 'justify-center px-2' : ''}`}
             title="Team"
             aria-label="Team Management"
             aria-current={view === 'TEAM_MANAGEMENT' ? 'page' : undefined}
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            {!collapsed && <span>Team</span>}
          </button>

          <button 
             onClick={() => { setView('COMPLETED_PROJECTS'); onClose(); }}
             className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 active:scale-95 ${view === 'COMPLETED_PROJECTS' ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-slate-800'} ${collapsed ? 'justify-center px-2' : ''}`}
             title="Completed Projects"
             aria-label="Completed Projects"
             aria-current={view === 'COMPLETED_PROJECTS' ? 'page' : undefined}
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
            {!collapsed && <span>Completed Projects</span>}
          </button>

          {!collapsed && <div className="mt-8 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider" id="active-projects-header">Active Projects</div>}
          <div className="space-y-1 mt-2" aria-labelledby="active-projects-header">
             {activeProjects.map(p => (
               <button
                 key={p.id}
                 onClick={() => { onSelectProject(p.id); onClose(); }}
                 className={`w-full text-left px-3 py-2 rounded text-sm truncate transition-colors ${selectedProjectId === p.id ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'} ${collapsed ? 'justify-center text-center' : ''}`}
                 title={p.name}
                 aria-label={`Project ${p.name}`}
                 aria-current={selectedProjectId === p.id ? 'page' : undefined}
               >
                 {collapsed ? p.name.substring(0,2).toUpperCase() : p.name}
               </button>
             ))}
           </div>
        </nav>
      </aside>
    </>
  );
};
