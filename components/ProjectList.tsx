
import React, { useState } from 'react';
import { Project } from '../types';
import { DeleteConfirmModal } from './DeleteConfirmModal';

interface ProjectListProps {
  title: string;
  projects: Project[];
  onSelectProject: (projectId: string) => void;
  onDeleteProject: (projectId: string) => void;
}

export const ProjectList: React.FC<ProjectListProps> = ({ title, projects, onSelectProject, onDeleteProject }) => {
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  const handleDeleteClick = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    setProjectToDelete(project);
  };

  const confirmDelete = () => {
    if (projectToDelete) {
      try {
        onDeleteProject(projectToDelete.id);
      } catch (error) {
        console.error("Failed to delete project", error);
        alert("An error occurred while deleting the project.");
      }
      setProjectToDelete(null);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in h-full overflow-y-auto">
      <h2 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white">{title}</h2>
      
      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/50">
          <p className="text-slate-500 dark:text-slate-400 font-medium">No projects found in this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(project => (
            <div 
              key={project.id} 
              onClick={() => onSelectProject(project.id)}
              className="cursor-pointer bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 hover:shadow-md transition-all relative group"
            >
              <div className="flex justify-between items-start mb-4">
                 <div className="flex-1">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-1">{project.name}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">{project.description}</p>
                 </div>
                 <button 
                    onClick={(e) => handleDeleteClick(e, project)}
                    className="text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 p-1.5 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors z-10"
                    title="Delete Project"
                    aria-label={`Delete project: ${project.name}`}
                 >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                 </button>
              </div>

              <div className="space-y-3">
                 <div className="flex justify-between text-sm">
                    <span className="text-slate-500 dark:text-slate-400">Progress</span>
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">{project.progress}%</span>
                 </div>
                 <div 
                   className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2"
                   role="progressbar"
                   aria-valuenow={project.progress}
                   aria-valuemin={0}
                   aria-valuemax={100}
                   aria-label={`Progress: ${project.progress}%`}
                 >
                    <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${project.progress}%` }}></div>
                 </div>
                 
                 <div className="flex justify-between items-center pt-2">
                    <div className="flex -space-x-2">
                        {project.team.slice(0, 3).map(m => (
                            <img key={m.id} src={m.avatar} alt={m.name} className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-800" title={m.name} />
                        ))}
                        {project.team.length > 3 && (
                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 border-2 border-white dark:border-slate-800 flex items-center justify-center text-xs text-slate-500 dark:text-slate-400" aria-label={`+${project.team.length - 3} more members`}>+{project.team.length - 3}</div>
                        )}
                    </div>
                    <span className="text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:underline">
                       View Details
                    </span>
                 </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <DeleteConfirmModal 
        isOpen={!!projectToDelete}
        onClose={() => setProjectToDelete(null)}
        onConfirm={confirmDelete}
        title="Delete Project?"
        message="This will permanently delete the project and all its tasks. This action cannot be undone."
        itemName={projectToDelete?.name}
      />
    </div>
  );
};
