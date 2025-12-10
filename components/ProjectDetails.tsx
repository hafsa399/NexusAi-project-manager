
import React, { useState, useEffect } from 'react';
import { Project, Task, TaskStatus, Priority, Risk, TaskHistory, TeamMember } from '../types';
import { analyzeProjectRisks, generateSmartReport } from '../services/geminiService';
import { DeleteConfirmModal } from './DeleteConfirmModal';

interface ProjectDetailsProps {
  project: Project;
  teamMembers: TeamMember[]; // Received from App state
  onUpdateProject: (updatedProject: Project) => void;
  onBack: () => void;
  onDeleteProject: (projectId: string) => void;
}

const INITIAL_NEW_TASK = {
  title: '',
  description: '',
  priority: Priority.Medium,
  estimatedHours: 4,
  assigneeId: '',
  deadline: '',
  reminderAt: ''
};

export const ProjectDetails: React.FC<ProjectDetailsProps> = ({ project, teamMembers, onUpdateProject, onBack, onDeleteProject }) => {
  const [activeTab, setActiveTab] = useState<'tasks' | 'risks' | 'report'>('tasks');
  const [loadingAI, setLoadingAI] = useState(false);
  const [reportText, setReportText] = useState<string>('');
  
  // Modals
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Delete States
  const [isProjectDeleteModalOpen, setIsProjectDeleteModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  // Completion Confirmation State
  const [isCompletionConfirmOpen, setIsCompletionConfirmOpen] = useState(false);
  const [pendingProjectUpdate, setPendingProjectUpdate] = useState<Project | null>(null);

  // State for Create/Edit
  const [newTask, setNewTask] = useState(INITIAL_NEW_TASK);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const draftNewTaskKey = `nexus_draft_new_${project.id}`;

  // Auto-save New Task Draft (Seamless) - safe storage
  useEffect(() => {
    try {
        if (isTaskModalOpen && (newTask.title || newTask.description)) {
            localStorage.setItem(draftNewTaskKey, JSON.stringify(newTask));
        }
    } catch(e) { console.warn("Failed to save draft"); }
  }, [newTask, isTaskModalOpen, draftNewTaskKey]);

  // Auto-save Edit Task Draft (Seamless)
  useEffect(() => {
    try {
        if (isEditModalOpen && selectedTask) {
            localStorage.setItem(`nexus_draft_edit_${project.id}_${selectedTask.id}`, JSON.stringify(selectedTask));
        }
    } catch(e) { console.warn("Failed to save draft"); }
  }, [selectedTask, isEditModalOpen, project.id]);

  const moveTask = (taskId: string, newStatus: TaskStatus) => {
    const task = project.tasks.find(t => t.id === taskId);
    if (!task) return;

    const historyEntry: TaskHistory = {
        id: crypto.randomUUID(),
        changeType: 'STATUS',
        description: `Status changed from ${task.status} to ${newStatus}`,
        timestamp: new Date().toISOString(),
        actorName: 'You'
    };

    let updatedTasks = project.tasks.map(t => 
      t.id === taskId ? { ...t, status: newStatus, history: [historyEntry, ...t.history] } : t
    );

    // AUTO-MOVE LOGIC: If a task is completed on time, move the next Pending task to In Progress
    if (newStatus === TaskStatus.Completed) {
        const now = new Date();
        let isLate = false;
        
        // Check if the completed task was late (Robust local date check)
        if (task.deadline) {
            const [year, month, day] = task.deadline.split('-').map(Number);
            const deadlineDate = new Date(year, month - 1, day);
            deadlineDate.setHours(23, 59, 59, 999);
            
            if (now > deadlineDate) {
                isLate = true;
            }
        }

        if (!isLate) {
            // Find the next logical task (first Pending task in the list)
            const nextPendingTask = updatedTasks.find(t => t.status === TaskStatus.Pending);

            if (nextPendingTask) {
                const autoEntry: TaskHistory = {
                    id: crypto.randomUUID(),
                    changeType: 'STATUS',
                    description: `Auto-started: Previous task completed on time`,
                    timestamp: new Date().toISOString(),
                    actorName: 'System'
                };

                updatedTasks = updatedTasks.map(t => 
                    t.id === nextPendingTask.id 
                    ? { ...t, status: TaskStatus.InProgress, history: [autoEntry, ...t.history] }
                    : t
                );
            }
        }
    }
    
    updateProjectTasks(updatedTasks);
  };

  const updateProjectTasks = (updatedTasks: Task[]) => {
    const completed = updatedTasks.filter(t => t.status === TaskStatus.Completed).length;
    const progress = Math.round((completed / updatedTasks.length) * 100);
    
    const updatedProject = { ...project, tasks: updatedTasks, progress };

    // Intercept 100% completion to ask for confirmation
    if (progress === 100 && project.progress < 100) {
      setPendingProjectUpdate(updatedProject);
      setIsCompletionConfirmOpen(true);
    } else {
      onUpdateProject(updatedProject);
    }
  };

  const confirmProjectCompletion = () => {
    if (pendingProjectUpdate) {
      onUpdateProject(pendingProjectUpdate);
    }
    setIsCompletionConfirmOpen(false);
    setPendingProjectUpdate(null);
  };

  const cancelProjectCompletion = () => {
    setIsCompletionConfirmOpen(false);
    setPendingProjectUpdate(null);
  };

  // Seamlessly load drafts without prompting
  const openNewTaskModal = () => {
    try {
      const saved = localStorage.getItem(draftNewTaskKey);
      if (saved) {
        setNewTask(JSON.parse(saved));
      } else {
        setNewTask(INITIAL_NEW_TASK);
      }
    } catch (e) {
      setNewTask(INITIAL_NEW_TASK);
    }
    setIsTaskModalOpen(true);
  };

  const closeNewTaskModal = () => {
    localStorage.removeItem(draftNewTaskKey);
    setIsTaskModalOpen(false);
    setNewTask(INITIAL_NEW_TASK);
  };

  const handleAddTask = () => {
    if (!newTask.title) return;

    const historyEntry: TaskHistory = {
        id: crypto.randomUUID(),
        changeType: 'CREATED',
        description: 'Task created',
        timestamp: new Date().toISOString(),
        actorName: 'You'
    };

    const task: Task = {
      id: crypto.randomUUID(),
      title: newTask.title,
      description: newTask.description,
      status: TaskStatus.Pending,
      priority: newTask.priority,
      estimatedHours: newTask.estimatedHours,
      assigneeId: newTask.assigneeId || undefined,
      deadline: newTask.deadline || undefined,
      reminderAt: newTask.reminderAt || undefined,
      history: [historyEntry]
    };

    updateProjectTasks([...project.tasks, task]);
    
    // Clear draft on success
    localStorage.removeItem(draftNewTaskKey);
    setNewTask(INITIAL_NEW_TASK);
    setIsTaskModalOpen(false);
  };

  const handleUpdateTask = () => {
    if (!selectedTask) return;

    const originalTask = project.tasks.find(t => t.id === selectedTask.id);
    if (!originalTask) return;

    const changes: TaskHistory[] = [];
    const timestamp = new Date().toISOString();
    
    const normalize = (val?: string) => (!val ? undefined : val);

    // Track Title Changes
    if (originalTask.title !== selectedTask.title) {
        changes.push({ 
            id: crypto.randomUUID(), 
            changeType: 'INFO', 
            description: `Title updated to "${selectedTask.title}"`, 
            timestamp, 
            actorName: 'You' 
        });
    }

    // Track Description Changes
    if (originalTask.description !== selectedTask.description) {
         changes.push({ 
            id: crypto.randomUUID(), 
            changeType: 'INFO', 
            description: `Description updated`, 
            timestamp, 
            actorName: 'You' 
        });
    }

    // Track Priority Changes
    if (originalTask.priority !== selectedTask.priority) {
        changes.push({ 
            id: crypto.randomUUID(), 
            changeType: 'PRIORITY', 
            description: `Priority changed from ${originalTask.priority} to ${selectedTask.priority}`, 
            timestamp, 
            actorName: 'You' 
        });
    }

    // Track Assignee Changes
    if (originalTask.assigneeId !== selectedTask.assigneeId) {
         const oldName = teamMembers.find(m => m.id === originalTask.assigneeId)?.name || 'Unassigned';
         const newName = teamMembers.find(m => m.id === selectedTask.assigneeId)?.name || 'Unassigned';
         changes.push({ 
            id: crypto.randomUUID(), 
            changeType: 'ASSIGNEE', 
            description: `Assignee changed from ${oldName} to ${newName}`, 
            timestamp, 
            actorName: 'You' 
        });
    }

    // Track Deadline Changes
    const oldDeadline = normalize(originalTask.deadline);
    const newDeadline = normalize(selectedTask.deadline);
    if (oldDeadline !== newDeadline) {
         const desc = newDeadline 
            ? `Deadline updated to ${newDeadline}` 
            : `Deadline removed (was ${oldDeadline})`;
         changes.push({ 
            id: crypto.randomUUID(), 
            changeType: 'DEADLINE', 
            description: desc, 
            timestamp, 
            actorName: 'You' 
        });
    }

    // Track Reminder Changes
    const oldReminder = normalize(originalTask.reminderAt);
    const newReminder = normalize(selectedTask.reminderAt);
    if (oldReminder !== newReminder) {
         const desc = newReminder 
            ? `Reminder set for ${new Date(newReminder).toLocaleString()}` 
            : `Reminder removed`;
         changes.push({ 
            id: crypto.randomUUID(), 
            changeType: 'INFO', 
            description: desc, 
            timestamp, 
            actorName: 'You' 
        });
    }

    const updatedTask = {
        ...selectedTask,
        deadline: newDeadline,
        reminderAt: newReminder,
        history: [...changes, ...(selectedTask.history || [])]
    };

    const updatedTasks = project.tasks.map(t => t.id === selectedTask.id ? updatedTask : t);
    updateProjectTasks(updatedTasks);
    
    // Clear draft on success
    localStorage.removeItem(`nexus_draft_edit_${project.id}_${selectedTask.id}`);
    setIsEditModalOpen(false);
    setSelectedTask(null);
  };

  const handleRiskAnalysis = async () => {
    setLoadingAI(true);
    try {
      const risks = await analyzeProjectRisks(project);
      const newRisks = risks.map((r: any) => ({
        id: crypto.randomUUID(),
        description: r.description,
        severity: r.severity,
        mitigationStrategy: r.mitigationStrategy
      }));
      onUpdateProject({ ...project, risks: [...project.risks, ...newRisks] });
    } catch (e) {
      alert("Failed to analyze risks.");
    } finally {
      setLoadingAI(false);
    }
  };

  const handleGenerateReport = async () => {
    setLoadingAI(true);
    try {
      const text = await generateSmartReport(project);
      setReportText(text);
    } catch (e) {
      alert("Failed to generate report");
    } finally {
      setLoadingAI(false);
    }
  };

  const handleDeleteProjectClick = () => {
      setIsProjectDeleteModalOpen(true);
  };

  const confirmDeleteProject = () => {
      onDeleteProject(project.id);
  };

  const handleDeleteTaskClick = (task: Task) => {
    setTaskToDelete(task);
  };

  const confirmDeleteTask = () => {
    if (taskToDelete) {
        const updatedTasks = project.tasks.filter(t => t.id !== taskToDelete.id);
        updateProjectTasks(updatedTasks);
        setTaskToDelete(null);
    }
  };

  const priorityColor = (p: Priority) => {
    switch(p) {
      case Priority.Critical: return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200';
      case Priority.High: return 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200';
      case Priority.Medium: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200';
      case Priority.Low: return 'bg-gray-100 text-gray-800 dark:bg-slate-700 dark:text-slate-200';
      default: return 'bg-gray-100 dark:bg-slate-700';
    }
  };

  // CORRECTED: Overdue logic (Dynamic Check with robust date parsing)
  const getDeadlineStatus = (task: Task) => {
    if (!task.deadline) return null;
    if (task.status === TaskStatus.Completed) return null; 

    // Explicitly parse YYYY-MM-DD to local midnight
    const [year, month, day] = task.deadline.split('-').map(Number);
    const deadlineDate = new Date(year, month - 1, day);
    
    // Start of today
    const today = new Date();
    today.setHours(0,0,0,0);
    
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

    // If diffDays < 0, it means the deadline is strictly before today -> Overdue
    if (diffDays < 0) return { label: 'Overdue', color: 'text-red-600 dark:text-red-400 font-bold', bg: 'bg-red-50 dark:bg-red-900/20' };
    if (diffDays <= 2) return { label: 'Due Soon', color: 'text-orange-600 dark:text-orange-400 font-bold', bg: 'bg-orange-50 dark:bg-orange-900/20' };
    return { label: deadlineDate.toLocaleDateString(), color: 'text-slate-400 dark:text-slate-500', bg: 'bg-transparent' };
  };

  const getAssignee = (id?: string) => {
      return teamMembers.find(m => m.id === id);
  };

  const openHistory = (task: Task) => {
      setSelectedTask(task);
      setIsHistoryModalOpen(true);
  };

  const openEdit = (task: Task) => {
    const draftKey = `nexus_draft_edit_${project.id}_${task.id}`;
    // Seamlessly load draft if exists
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        setSelectedTask(JSON.parse(saved));
      } else {
        setSelectedTask(task);
      }
    } catch (e) {
      setSelectedTask(task);
    }
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    // Explicit cancel -> clear draft
    if (selectedTask) {
        localStorage.removeItem(`nexus_draft_edit_${project.id}_${selectedTask.id}`);
    }
    setIsEditModalOpen(false);
    setSelectedTask(null);
  };

  return (
    <div className="flex flex-col h-full space-y-4 md:space-y-6 relative transition-colors duration-200">
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
        <div>
           <button onClick={onBack} className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline mb-2 flex items-center" aria-label="Back to Dashboard">
             <span className="text-lg mr-1" aria-hidden="true">←</span> Back to Dashboard
           </button>
           <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white break-words">{project.name}</h1>
           <p className="text-slate-500 dark:text-slate-400 mt-1 max-w-2xl text-sm md:text-base">{project.description}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
            <div className="flex flex-wrap gap-2 justify-end">
                <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-xs md:text-sm font-semibold border border-indigo-200 dark:border-indigo-800">
                Budget: ${project.budget.toLocaleString()}
                </span>
                <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-xs md:text-sm font-semibold border border-indigo-200 dark:border-indigo-800">
                Ends: {project.endDate}
                </span>
            </div>
            <button 
               onClick={handleDeleteProjectClick}
               className="text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1 rounded-lg transition-colors text-sm flex items-center gap-1"
               aria-label="Delete Project"
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                Delete Project
            </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 justify-between items-center overflow-x-auto pb-1 md:pb-0" role="tablist" aria-label="Project View Tabs">
        <div className="flex flex-nowrap min-w-max">
            <button 
            role="tab"
            aria-selected={activeTab === 'tasks'}
            onClick={() => setActiveTab('tasks')}
            className={`px-4 md:px-6 py-3 font-medium text-sm transition-colors whitespace-nowrap ${activeTab === 'tasks' ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
            >
            Task Board
            </button>
            <button 
            role="tab"
            aria-selected={activeTab === 'risks'}
            onClick={() => setActiveTab('risks')}
            className={`px-4 md:px-6 py-3 font-medium text-sm transition-colors whitespace-nowrap ${activeTab === 'risks' ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
            >
            Risk Management
            </button>
            <button 
            role="tab"
            aria-selected={activeTab === 'report'}
            onClick={() => setActiveTab('report')}
            className={`px-4 md:px-6 py-3 font-medium text-sm transition-colors whitespace-nowrap ${activeTab === 'report' ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
            >
            Reports & AI
            </button>
        </div>
        
        {activeTab === 'tasks' && (
             <button 
               onClick={openNewTaskModal}
               className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white text-sm font-semibold px-3 py-1.5 md:px-4 md:py-2 rounded-lg shadow-sm flex items-center gap-2 whitespace-nowrap ml-4"
               aria-label="Add new task"
             >
               <span className="text-lg leading-none" aria-hidden="true">+</span>
               <span className="hidden md:inline">Add Task</span>
             </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto bg-slate-50/50 dark:bg-slate-900/50 p-2 rounded-lg" role="tabpanel">
        {activeTab === 'tasks' && (
          <div className="flex gap-4 h-full min-w-full overflow-x-auto pb-4 snap-x snap-mandatory">
             {Object.values(TaskStatus)
              .filter(status => status !== TaskStatus.Blocked) // REMOVED BLOCKED COLUMN
              .map(status => (
               <div key={status} className="flex-shrink-0 w-[85vw] md:w-80 bg-slate-100 dark:bg-slate-800/50 rounded-lg p-3 h-fit max-h-full overflow-y-auto snap-center border border-slate-200 dark:border-slate-700">
                 <h3 className="text-sm font-bold text-slate-600 dark:text-slate-300 uppercase mb-3 flex justify-between items-center sticky top-0 bg-slate-100 dark:bg-slate-800/50 z-10 py-1 backdrop-blur-sm">
                   {status}
                   <span className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs px-2 py-0.5 rounded-full" aria-label={`${project.tasks.filter(t => t.status === status).length} tasks`}>{project.tasks.filter(t => t.status === status).length}</span>
                 </h3>
                 <div className="space-y-3">
                    {project.tasks.filter(t => t.status === status).map(task => {
                      const deadlineInfo = getDeadlineStatus(task); // Pass full task object
                      const assignee = getAssignee(task.assigneeId);
                      
                      return (
                        <div key={task.id} className="bg-white dark:bg-slate-800 p-3 rounded shadow-sm border border-slate-200 dark:border-slate-700 group hover:shadow-md transition-shadow relative">
                          <div className="flex justify-between items-start mb-2">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wide font-bold ${priorityColor(task.priority)}`}>
                              {task.priority}
                            </span>
                            <div className="flex gap-1 md:opacity-0 group-hover:opacity-100 transition-opacity absolute top-3 right-3 bg-white dark:bg-slate-800 pl-2 shadow-sm rounded-bl-lg">
                              <button 
                                onClick={() => openEdit(task)}
                                className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 p-1.5 rounded transition-colors" title="Edit Task"
                                aria-label={`Edit task: ${task.title}`}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                              </button>
                              <button 
                                onClick={() => openHistory(task)}
                                className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 p-1.5 rounded transition-colors" title="View History"
                                aria-label={`View history for task: ${task.title}`}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                              </button>
                              <button
                                onClick={() => handleDeleteTaskClick(task)}
                                className="text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 p-1.5 rounded transition-colors"
                                title="Delete Task"
                                aria-label={`Delete task: ${task.title}`}
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              </button>
                              {status !== TaskStatus.Completed && (
                                 <button 
                                   onClick={() => moveTask(task.id, TaskStatus.Completed)}
                                   className="text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 p-1.5 rounded" title="Mark Complete"
                                   aria-label={`Mark task ${task.title} as complete`}
                                  >
                                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                 </button>
                              )}
                            </div>
                          </div>
                          <h4 className="font-semibold text-slate-800 dark:text-slate-100 text-sm mb-1 pr-6">{task.title}</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{task.description}</p>
                          
                          <div className="mt-3 flex justify-between items-end border-t border-slate-50 dark:border-slate-700/50 pt-2">
                             <div className="flex items-center gap-2">
                               {assignee ? (
                                   <div className="flex items-center gap-1.5" title={assignee.name}>
                                       <img src={assignee.avatar} alt={assignee.name} className="w-6 h-6 rounded-full border border-slate-200 dark:border-slate-600" />
                                       <span className="text-[10px] text-slate-600 dark:text-slate-300 font-medium max-w-[60px] truncate">{assignee.name}</span>
                                   </div>
                               ) : (
                                   <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center" title="Unassigned">
                                       <svg className="w-3 h-3 text-slate-300 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                   </div>
                               )}
                             </div>
                             
                             <div className="flex flex-col items-end gap-1">
                               {task.reminderAt && (
                                 <span className="flex items-center text-[10px] text-indigo-500 dark:text-indigo-400 font-medium" title={`Reminder set for ${new Date(task.reminderAt).toLocaleString()}`}>
                                   <svg className="w-3 h-3 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                                   Remind
                                 </span>
                               )}
                               {deadlineInfo && (
                                 <span className={`text-[10px] px-1.5 py-0.5 rounded ${deadlineInfo.bg} ${deadlineInfo.color}`}>
                                   {deadlineInfo.label}
                                 </span>
                               )}
                               <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{task.estimatedHours}h</span>
                             </div>
                          </div>
                        </div>
                      );
                    })}
                    {project.tasks.filter(t => t.status === status).length === 0 && (
                      <div className="text-center py-6 text-slate-400 dark:text-slate-500 text-sm border-2 border-dashed border-slate-200 dark:border-slate-700 rounded">No tasks</div>
                    )}
                 </div>
               </div>
             ))}
          </div>
        )}

        {/* ... Risks and Reports Tabs remain unchanged ... */}
        {activeTab === 'risks' && (
          <div className="p-2 md:p-4 max-w-4xl">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white">AI Risk Assessment</h3>
                <button 
                  onClick={handleRiskAnalysis}
                  disabled={loadingAI}
                  className="w-full sm:w-auto px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                  aria-live="polite"
                >
                  {loadingAI ? 'Analyzing...' : 'Run Risk Analysis'}
                </button>
             </div>
             
             {project.risks.length === 0 ? (
               <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                 <p className="text-slate-500 dark:text-slate-400 mb-2">No risks identified yet.</p>
                 <p className="text-sm text-slate-400 dark:text-slate-500">Run the AI analysis to identify potential bottlenecks.</p>
               </div>
             ) : (
               <div className="space-y-4">
                 {project.risks.map(risk => (
                   <div key={risk.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border-l-4 border-rose-500 shadow-sm flex flex-col sm:flex-row gap-4">
                     <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                           <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${risk.severity === 'High' ? 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-200' : 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-200'}`}>{risk.severity} Severity</span>
                           <h4 className="font-semibold text-slate-800 dark:text-slate-100">Risk Detected</h4>
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 mb-3 text-sm">{risk.description}</p>
                        <div className="bg-rose-50 dark:bg-rose-900/20 p-3 rounded text-sm text-rose-800 dark:text-rose-300">
                           <strong>Mitigation: </strong> {risk.mitigationStrategy}
                        </div>
                     </div>
                   </div>
                 ))}
               </div>
             )}
          </div>
        )}

        {activeTab === 'report' && (
          <div className="p-2 md:p-4 max-w-4xl mx-auto">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Professional Reporting</h3>
                 <div className="flex gap-2 w-full sm:w-auto">
                    <button 
                      onClick={handleGenerateReport}
                      disabled={loadingAI}
                      className="flex-1 sm:flex-none px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                      aria-live="polite"
                    >
                      {loadingAI ? 'Drafting Report...' : 'Generate Status Report'}
                    </button>
                 </div>
             </div>

             {reportText ? (
                <div className="bg-white dark:bg-slate-800 p-4 md:p-8 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 prose prose-slate dark:prose-invert max-w-none prose-sm md:prose-base">
                  <div className="whitespace-pre-wrap">{reportText}</div>
                </div>
             ) : (
               <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                 <p className="text-slate-500 dark:text-slate-400">Generate a comprehensive status report instantly.</p>
               </div>
             )}
          </div>
        )}
      </div>

      {/* ... Add Task Modal, Edit Task Modal, History Modal ... */}
      
      {/* Add Task Modal */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="modal-add-task-title">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden max-h-[90vh] overflow-y-auto">
                <div className="bg-indigo-600 px-6 py-4 flex justify-between items-center sticky top-0">
                    <h3 id="modal-add-task-title" className="text-white font-bold text-lg">Add New Task</h3>
                    <button onClick={closeNewTaskModal} className="text-indigo-200 hover:text-white" aria-label="Close modal">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label htmlFor="new-task-title" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Task Title</label>
                        <input 
                          id="new-task-title"
                          type="text" 
                          className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                          placeholder="e.g. Implement Login API"
                          value={newTask.title}
                          onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                        />
                    </div>
                    <div>
                        <label htmlFor="new-task-desc" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                        <textarea 
                          id="new-task-desc"
                          className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none resize-none h-20"
                          placeholder="Task details..."
                          value={newTask.description}
                          onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                        />
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="new-task-assignee" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Assignee</label>
                            <select 
                                id="new-task-assignee"
                                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none max-h-48"
                                value={newTask.assigneeId}
                                onChange={(e) => setNewTask({...newTask, assigneeId: e.target.value})}
                            >
                                <option value="">Unassigned</option>
                                {/* USE GLOBAL TEAM MEMBERS */}
                                {teamMembers.map(member => (
                                    <option key={member.id} value={member.id}>{member.name} - {member.role}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="new-task-priority" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Priority</label>
                            <select 
                                id="new-task-priority"
                                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={newTask.priority}
                                onChange={(e) => setNewTask({...newTask, priority: e.target.value as Priority})}
                            >
                                {Object.values(Priority).map(p => (
                                    <option key={p} value={p}>{p}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="new-task-hours" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Estimated Hours</label>
                            <input 
                              id="new-task-hours"
                              type="number" 
                              min="1"
                              className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                              value={newTask.estimatedHours}
                              onChange={(e) => setNewTask({...newTask, estimatedHours: parseInt(e.target.value) || 0})}
                            />
                        </div>
                        <div>
                            <label htmlFor="new-task-deadline" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Deadline</label>
                            <input 
                              id="new-task-deadline"
                              type="date" 
                              className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                              value={newTask.deadline}
                              onChange={(e) => setNewTask({...newTask, deadline: e.target.value})}
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="new-task-reminder" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Set Reminder</label>
                        <input 
                          id="new-task-reminder"
                          type="datetime-local" 
                          className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                          value={newTask.reminderAt}
                          onChange={(e) => setNewTask({...newTask, reminderAt: e.target.value})}
                        />
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Receive a notification at this time.</p>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button 
                          onClick={closeNewTaskModal}
                          className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg font-medium"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={handleAddTask}
                          disabled={!newTask.title}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-sm disabled:opacity-50"
                        >
                          Create Task
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* History Modal */}
      {isHistoryModalOpen && selectedTask && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="modal-history-title">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
            <div className="bg-slate-100 dark:bg-slate-700 px-6 py-4 flex justify-between items-center border-b border-slate-200 dark:border-slate-600">
               <h3 id="modal-history-title" className="font-bold text-lg text-slate-700 dark:text-slate-200">History: {selectedTask.title}</h3>
               <button onClick={() => setIsHistoryModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200" aria-label="Close modal">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
               </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
               {selectedTask.history && selectedTask.history.length > 0 ? (
                 <div className="relative border-l-2 border-slate-200 dark:border-slate-600 ml-3 space-y-6">
                   {selectedTask.history.map((log) => (
                     <div key={log.id} className="relative pl-6">
                        <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-indigo-500 border-2 border-white dark:border-slate-800" aria-hidden="true"></div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{log.description}</p>
                        <div className="flex gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                           <span>{new Date(log.timestamp).toLocaleString()}</span>
                           <span>•</span>
                           <span>{log.actorName || 'System'}</span>
                        </div>
                     </div>
                   ))}
                 </div>
               ) : (
                 <div className="text-center text-slate-500 dark:text-slate-400 py-8">No history available.</div>
               )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {isEditModalOpen && selectedTask && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="modal-edit-task-title">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="bg-indigo-600 px-6 py-4 flex justify-between items-center sticky top-0">
                <h3 id="modal-edit-task-title" className="text-white font-bold text-lg">Edit Task</h3>
                <button onClick={closeEditModal} className="text-indigo-200 hover:text-white" aria-label="Close modal">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
            <div className="p-6 space-y-4">
               <div>
                  <label htmlFor="edit-task-title" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Title</label>
                  <input 
                    id="edit-task-title"
                    type="text" 
                    className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={selectedTask.title}
                    onChange={(e) => setSelectedTask({...selectedTask, title: e.target.value})}
                  />
               </div>
               
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="edit-task-assignee" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Assignee</label>
                    <select 
                        id="edit-task-assignee"
                        className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none max-h-48"
                        value={selectedTask.assigneeId || ''}
                        onChange={(e) => setSelectedTask({...selectedTask, assigneeId: e.target.value})}
                    >
                        <option value="">Unassigned</option>
                        {/* USE GLOBAL TEAM MEMBERS */}
                        {teamMembers.map(member => (
                            <option key={member.id} value={member.id}>{member.name} - {member.role}</option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="edit-task-priority" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Priority</label>
                    <select 
                        id="edit-task-priority"
                        className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={selectedTask.priority}
                        onChange={(e) => setSelectedTask({...selectedTask, priority: e.target.value as Priority})}
                    >
                        {Object.values(Priority).map(p => (
                            <option key={p} value={p}>{p}</option>
                        ))}
                    </select>
                  </div>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="edit-task-deadline" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Deadline</label>
                    <input 
                      id="edit-task-deadline"
                      type="date" 
                      className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={selectedTask.deadline || ''}
                      onChange={(e) => setSelectedTask({...selectedTask, deadline: e.target.value})}
                    />
                  </div>
                   <div>
                    <label htmlFor="edit-task-reminder" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Reminder</label>
                    <input 
                      id="edit-task-reminder"
                      type="datetime-local" 
                      className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={selectedTask.reminderAt || ''}
                      onChange={(e) => setSelectedTask({...selectedTask, reminderAt: e.target.value})}
                    />
                  </div>
               </div>

               <div className="pt-4 flex justify-end gap-3">
                  <button onClick={closeEditModal} className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg font-medium">Cancel</button>
                  <button onClick={handleUpdateTask} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-sm">Save Changes</button>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Completion Confirmation Modal */}
      {isCompletionConfirmOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="modal-complete-title">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-fade-in">
              <div className="p-6 text-center">
                  <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4" aria-hidden="true">
                      <svg className="w-8 h-8 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                  </div>
                  <h3 id="modal-complete-title" className="text-xl font-bold text-slate-800 dark:text-white mb-2">Complete Project?</h3>
                  <p className="text-slate-600 dark:text-slate-300 mb-6">
                      All tasks are finished. This will mark the project as <strong>Completed</strong> and move it to the archive.
                  </p>
                  <div className="flex gap-3 justify-center">
                      <button 
                          onClick={cancelProjectCompletion}
                          className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg font-medium"
                      >
                          Cancel
                      </button>
                      <button 
                          onClick={confirmProjectCompletion}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium shadow-sm"
                      >
                          Confirm Completion
                      </button>
                  </div>
              </div>
          </div>
        </div>
      )}
      
      {/* Delete Project Modal */}
      <DeleteConfirmModal 
        isOpen={isProjectDeleteModalOpen}
        onClose={() => setIsProjectDeleteModalOpen(false)}
        onConfirm={confirmDeleteProject}
        title="Delete Project?"
        message="This will permanently delete the project and all its data. This action cannot be undone."
        itemName={project.name}
      />

      {/* Delete Task Modal */}
      <DeleteConfirmModal 
        isOpen={!!taskToDelete}
        onClose={() => setTaskToDelete(null)}
        onConfirm={confirmDeleteTask}
        title="Delete Task?"
        message="Are you sure you want to delete this task? This action cannot be undone."
        itemName={taskToDelete?.title}
      />

    </div>
  );
};
