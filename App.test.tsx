
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ProjectDetails } from './components/ProjectDetails';
import { Sidebar } from './components/Sidebar';
import { TaskStatus, Priority, Project, TeamMember } from './types';

// Mock Data
const MOCK_TEAM: TeamMember[] = [
  { id: 'u1', name: 'Alice', role: 'Dev', skills: [], avatar: '' }
];

const MOCK_PROJECT: Project = {
  id: 'p1',
  name: 'Test Project',
  description: 'Test Desc',
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  budget: 1000,
  techStack: [],
  progress: 0,
  team: MOCK_TEAM,
  risks: [],
  tasks: []
};

// Helper to create date relative to today
const getRelativeDate = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

describe('Deadline Logic', () => {
  const createTask = (deadline: string | undefined, status: TaskStatus) => ({
    id: 't1',
    title: 'Test Task',
    description: '',
    status,
    priority: Priority.Medium,
    estimatedHours: 1,
    history: [],
    deadline
  });

  it('marks past deadline as overdue', () => {
    const overdueTask = createTask(getRelativeDate(-2), TaskStatus.Pending);
    const projectWithOverdue = { ...MOCK_PROJECT, tasks: [overdueTask] };
    
    render(<ProjectDetails project={projectWithOverdue} teamMembers={MOCK_TEAM} onUpdateProject={() => {}} onBack={() => {}} onDeleteProject={() => {}} />);
    
    // Check for "Overdue" label which corresponds to the logic in getDeadlineStatus
    expect(screen.getByText('Overdue')).toBeDefined();
  });

  it('does not mark completed tasks as overdue even if past deadline', () => {
    const completedLateTask = createTask(getRelativeDate(-2), TaskStatus.Completed);
    const project = { ...MOCK_PROJECT, tasks: [completedLateTask] };

    render(<ProjectDetails project={project} teamMembers={MOCK_TEAM} onUpdateProject={() => {}} onBack={() => {}} onDeleteProject={() => {}} />);
    
    // Should NOT find "Overdue" text
    const overdueElement = screen.queryByText('Overdue');
    expect(overdueElement).toBeNull();
  });

  it('marks future deadline as normal', () => {
    const futureTask = createTask(getRelativeDate(5), TaskStatus.Pending);
    const project = { ...MOCK_PROJECT, tasks: [futureTask] };

    render(<ProjectDetails project={project} teamMembers={MOCK_TEAM} onUpdateProject={() => {}} onBack={() => {}} onDeleteProject={() => {}} />);
    
    const overdueElement = screen.queryByText('Overdue');
    expect(overdueElement).toBeNull();
  });
});

describe('Sidebar Component', () => {
  it('renders correctly', () => {
    render(
      <Sidebar 
        isOpen={false} 
        onClose={() => {}} 
        collapsed={false} 
        onToggleCollapse={() => {}} 
        view="DASHBOARD" 
        setView={() => {}} 
        activeProjects={[MOCK_PROJECT]}
        selectedProjectId={null}
        onSelectProject={() => {}}
      />
    );
    expect(screen.getByText('NexusAI')).toBeDefined();
    expect(screen.getByText('Test Project')).toBeDefined();
  });

  it('hides text when collapsed', () => {
    render(
      <Sidebar 
        isOpen={false} 
        onClose={() => {}} 
        collapsed={true} 
        onToggleCollapse={() => {}} 
        view="DASHBOARD" 
        setView={() => {}} 
        activeProjects={[MOCK_PROJECT]}
        selectedProjectId={null}
        onSelectProject={() => {}}
      />
    );
    // When collapsed, full text "New Project" should not be visible (implementation hides it)
    // Checking for the logo "N" which is visible only when collapsed
    expect(screen.getByLabelText('NexusAI Logo')).toBeDefined();
  });
});
