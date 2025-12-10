
import React, { useState, useEffect } from 'react';
import { Project, ViewState, TeamMember, TaskStatus, Priority, AppNotification, User } from './types';
import { Dashboard } from './components/Dashboard';
import { ProjectCreate } from './components/ProjectCreate';
import { ProjectDetails } from './components/ProjectDetails';
import { TeamManagement } from './components/TeamManagement';
import { ProjectList } from './components/ProjectList';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { AuthScreen } from './components/AuthScreen';
import { authService } from './services/authService';

const INITIAL_TEAM: TeamMember[] = [
  { 
    id: 'u1', 
    name: 'Alice Chen', 
    role: 'Frontend Lead', 
    skills: ['React', 'TypeScript', 'Tailwind'], 
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice' 
  },
  { 
    id: 'u2', 
    name: 'Bob Smith', 
    role: 'Backend Engineer', 
    skills: ['Node.js', 'PostgreSQL', 'Redis'], 
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob' 
  },
  { 
    id: 'u3', 
    name: 'Charlie Kim', 
    role: 'UI/UX Designer', 
    skills: ['Figma', 'CSS', 'User Research'], 
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie' 
  },
  { 
    id: 'u4', 
    name: 'Diana Prince', 
    role: 'Product Manager', 
    skills: ['Agile', 'Strategy', 'Roadmapping'], 
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Diana' 
  },
];

// Helper to generate dynamic dates
const getRelativeDate = (daysOffset: number) => {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().split('T')[0];
};

// Cleaned project list - Uses dynamic dates to ensure validity
const INITIAL_PROJECTS: Project[] = [
  {
    id: 'p1',
    name: 'E-Commerce Revamp',
    description: 'Modernizing the legacy shopping cart experience with Next.js and Stripe integration.',
    startDate: getRelativeDate(-10), // Started 10 days ago
    endDate: getRelativeDate(45), // Ends in 45 days
    budget: 45000,
    techStack: ['React', 'Node.js', 'Stripe'],
    progress: 65,
    team: INITIAL_TEAM, // Ensure initial project has full team visibility if desired, or subset
    risks: [
      { id: 'r1', description: 'Third-party API limits', severity: 'Medium', mitigationStrategy: 'Implement caching layer' }
    ],
    tasks: [
      { 
        id: 't1', 
        title: 'Setup Repo & CI/CD', 
        description: 'Initialize project structure and GitHub Actions.', 
        status: TaskStatus.Completed, 
        priority: Priority.High, 
        estimatedHours: 8,
        assigneeId: 'u2',
        deadline: getRelativeDate(-5), // Due 5 days ago (Completed)
        history: [
            { id: 'h1', changeType: 'CREATED', description: 'Task created', timestamp: getRelativeDate(-10), actorName: 'System' },
            { id: 'h2', changeType: 'STATUS', description: 'Moved to Completed', timestamp: getRelativeDate(-5), actorName: 'Bob Smith' }
        ]
      },
      { 
        id: 't2', 
        title: 'Design Checkout Flow', 
        description: 'Create high-fidelity mockups for checkout.', 
        status: TaskStatus.InProgress, 
        priority: Priority.Critical, 
        estimatedHours: 16,
        assigneeId: 'u3',
        deadline: getRelativeDate(5), // Due in 5 days
        history: [
            { id: 'h3', changeType: 'CREATED', description: 'Task created', timestamp: getRelativeDate(-9), actorName: 'System' }
        ]
      },
      { 
        id: 't3', 
        title: 'Stripe Integration', 
        description: 'Implement payment intent and webhooks.', 
        status: TaskStatus.Pending, 
        priority: Priority.High, 
        estimatedHours: 24,
        assigneeId: 'u1',
        deadline: getRelativeDate(15), // Due in 15 days
        history: [
            { id: 'h4', changeType: 'CREATED', description: 'Task created', timestamp: getRelativeDate(-9), actorName: 'System' }
        ]
      }
    ]
  }
];

export default function App() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [view, setView] = useState<ViewState>('DASHBOARD');
  
  // 1. Persistent State Initialization
  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      const saved = localStorage.getItem('nexus_projects');
      return saved ? JSON.parse(saved) : INITIAL_PROJECTS;
    } catch (error) {
      console.error('Failed to load projects from storage', error);
      return INITIAL_PROJECTS;
    }
  });

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(() => {
    try {
      const saved = localStorage.getItem('nexus_team');
      return saved ? JSON.parse(saved) : INITIAL_TEAM;
    } catch (error) {
      console.error('Failed to load team from storage', error);
      return INITIAL_TEAM;
    }
  });

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  
  // Navigation State
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('theme') === 'dark';
    } catch (e) { return false; }
  });
  
  // Notification State
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem('nexus_notifications');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      return [];
    }
  });

  // Check Authentication on Mount
  useEffect(() => {
    const user = authService.getCurrentUser();
    if (user) {
        setCurrentUser(user);
    }
  }, []);

  // 2. Auto-Save Effects - Wrapped in try/catch to prevent crashes if quota exceeded
  useEffect(() => {
    try {
      localStorage.setItem('nexus_projects', JSON.stringify(projects));
    } catch (e) { console.error("Failed to save projects", e); }
  }, [projects]);

  useEffect(() => {
    try {
      localStorage.setItem('nexus_team', JSON.stringify(teamMembers));
    } catch (e) { console.error("Failed to save team", e); }
  }, [teamMembers]);

  useEffect(() => {
    try {
      localStorage.setItem('nexus_notifications', JSON.stringify(notifications));
    } catch (e) { console.error("Failed to save notifications", e); }
  }, [notifications]);

  // Theme Effect
  useEffect(() => {
    try {
      if (darkMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
    } catch (e) { console.error("Failed to save theme", e); }
  }, [darkMode]);

  const toggleTheme = () => setDarkMode(!darkMode);

  // Notification & Overdue Logic
  useEffect(() => {
    if (!currentUser) return; // Don't run checks if not logged in

    // Request permission on mount
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const checkReminders = () => {
      const now = new Date();
      projects.forEach(project => {
        project.tasks.forEach(task => {
          if (task.status === TaskStatus.Completed) return;

          // Check Reminder
          if (task.reminderAt) {
            const reminderTime = new Date(task.reminderAt);
            // Ensure reminderTime is valid
            if (!isNaN(reminderTime.getTime())) {
                const timeDiff = now.getTime() - reminderTime.getTime();
                
                // If the reminder is due (within the last minute)
                if (timeDiff >= 0 && timeDiff < 60000) {
                  const newNotification: AppNotification = {
                    id: crypto.randomUUID(),
                    title: `Reminder: ${task.title}`,
                    message: `Project: ${project.name} - Task is due soon!`,
                    time: now.toISOString(),
                    type: 'reminder',
                    read: false
                  };
                  
                  setNotifications(prev => {
                    const exists = prev.some(n => n.title === newNotification.title && Math.abs(new Date(n.time).getTime() - now.getTime()) < 60000);
                    return exists ? prev : [newNotification, ...prev];
                  });

                  if (Notification.permission === 'granted') {
                     try {
                        new Notification(newNotification.title, {
                          body: newNotification.message,
                          icon: '/favicon.ico'
                        });
                     } catch(e) { /* Ignore notification errors */ }
                  }
                }
            }
          }
        });
      });
    };

    const intervalId = setInterval(checkReminders, 30000); // Check every 30s
    // Run once on mount to catch anything missed while closed
    checkReminders();
    
    return () => clearInterval(intervalId);
  }, [projects, currentUser]);

  // Derived state
  const activeProjects = projects.filter(p => p.progress < 100);
  const completedProjects = projects.filter(p => p.progress === 100);
  const activeProject = projects.find(p => p.id === selectedProjectId);

  // Safety Effect
  useEffect(() => {
    if (view === 'PROJECT_DETAILS' && selectedProjectId && !activeProject) {
      setView('DASHBOARD');
      setSelectedProjectId(null);
    }
  }, [selectedProjectId, activeProject, view]);

  // AUTH HANDLERS
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    // Reload team members just in case a new user registered and was added to the team list
    try {
        const updatedTeam = localStorage.getItem('nexus_team');
        if (updatedTeam) {
            setTeamMembers(JSON.parse(updatedTeam));
        }
    } catch(e) { console.error("Failed to sync team on login", e); }
  };

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    setView('DASHBOARD');
  };

  // PROJECT HANDLERS
  const handleCreateProject = (newProject: Project) => {
    const projectWithTeam = {
        ...newProject,
        team: teamMembers 
    };
    setProjects(prev => [projectWithTeam, ...prev]);
    setView('DASHBOARD');
  };

  const handleUpdateProject = (updated: Project) => {
    setProjects(prev => prev.map(p => p.id === updated.id ? updated : p));
  };

  const handleDeleteProject = (projectId: string) => {
      setProjects(prev => prev.filter(p => p.id !== projectId));
      if (selectedProjectId === projectId) {
          setView('DASHBOARD');
          setSelectedProjectId(null);
      }
  };

  const handleAddMember = (member: TeamMember) => {
    setTeamMembers(prev => [...prev, member]);
  };

  const handleUpdateMember = (updatedMember: TeamMember) => {
    setTeamMembers(prev => prev.map(m => m.id === updatedMember.id ? updatedMember : m));
    setProjects(prev => prev.map(p => ({
        ...p,
        team: p.team.map(t => t.id === updatedMember.id ? updatedMember : t)
    })));
  };

  const handleDeleteMember = (id: string) => {
    setTeamMembers(prev => prev.filter(m => m.id !== id));
    setProjects(prev => prev.map(p => ({
        ...p,
        team: p.team.filter(t => t.id !== id)
    })));
  };

  const handleSearchResultSelect = (type: 'PROJECT' | 'TEAM', id: string) => {
    if (type === 'PROJECT') {
      setSelectedProjectId(id);
      setView('PROJECT_DETAILS');
    } else {
      setView('TEAM_MANAGEMENT');
    }
  };

  // If not logged in, show Auth Screen
  if (!currentUser) {
    return (
        <div className={darkMode ? 'dark' : ''}>
            <AuthScreen onLoginSuccess={handleLogin} />
        </div>
    );
  }

  // Main App
  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans overflow-hidden transition-colors duration-200">
      
      <Sidebar 
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        view={view}
        setView={(v) => { setView(v); setSelectedProjectId(null); }}
        activeProjects={activeProjects}
        selectedProjectId={selectedProjectId}
        onSelectProject={(id) => { setSelectedProjectId(id); setView('PROJECT_DETAILS'); }}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar 
          user={currentUser}
          onToggleSidebar={() => setMobileMenuOpen(!mobileMenuOpen)}
          projects={projects}
          team={teamMembers}
          notifications={notifications}
          onClearNotifications={() => setNotifications([])}
          onSearchResultSelect={handleSearchResultSelect}
          darkMode={darkMode}
          toggleTheme={toggleTheme}
          onLogout={handleLogout}
        />

        <main className="flex-1 overflow-hidden relative w-full scroll-smooth">
          {view === 'DASHBOARD' && <Dashboard projects={projects} />}
          
          {view === 'CREATE_PROJECT' && (
              <div className="p-4 md:p-6 h-full overflow-y-auto">
                <ProjectCreate 
                  onProjectCreated={handleCreateProject} 
                  onCancel={() => setView('DASHBOARD')}
                  teamMembers={teamMembers}
                />
              </div>
          )}

          {view === 'PROJECT_DETAILS' && activeProject && (
            <div className="p-4 md:p-6 h-full overflow-hidden">
              <ProjectDetails 
                project={activeProject} 
                teamMembers={teamMembers}
                onUpdateProject={handleUpdateProject}
                onBack={() => setView('DASHBOARD')}
                onDeleteProject={handleDeleteProject}
              />
            </div>
          )}

          {view === 'COMPLETED_PROJECTS' && (
              <div className="p-4 md:p-6 h-full overflow-hidden">
                  <ProjectList 
                      title="Completed Projects" 
                      projects={completedProjects} 
                      onSelectProject={(id) => { setSelectedProjectId(id); setView('PROJECT_DETAILS'); }}
                      onDeleteProject={handleDeleteProject}
                  />
              </div>
          )}

          {view === 'TEAM_MANAGEMENT' && (
            <div className="h-full overflow-y-auto bg-slate-50 dark:bg-slate-950">
              <TeamManagement 
                members={teamMembers} 
                onAddMember={handleAddMember}
                onUpdateMember={handleUpdateMember}
                onDeleteMember={handleDeleteMember}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
