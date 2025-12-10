
export enum TaskStatus {
  Pending = "Pending",
  InProgress = "In Progress",
  Completed = "Completed",
  Blocked = "Blocked"
}

export enum Priority {
  Low = "Low",
  Medium = "Medium",
  High = "High",
  Critical = "Critical"
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  skills: string[];
  avatar: string;
}

export interface TaskHistory {
  id: string;
  changeType: 'STATUS' | 'PRIORITY' | 'ASSIGNEE' | 'DEADLINE' | 'INFO' | 'CREATED';
  description: string;
  timestamp: string;
  actorName?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assigneeId?: string;
  status: TaskStatus;
  priority: Priority;
  deadline?: string;
  estimatedHours: number;
  history: TaskHistory[];
  reminderAt?: string; // ISO string for specific reminder time
}

export interface Risk {
  id: string;
  description: string;
  severity: "Low" | "Medium" | "High";
  mitigationStrategy: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  budget: number;
  techStack: string[];
  tasks: Task[];
  team: TeamMember[];
  risks: Risk[];
  progress: number; // 0-100
}

export type ViewState = 'DASHBOARD' | 'COMPLETED_PROJECTS' | 'PROJECT_DETAILS' | 'CREATE_PROJECT' | 'TEAM_MANAGEMENT';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  passwordHash?: string; // In a real app, this never goes to frontend, but we are simulating backend here
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'reminder' | 'warning' | 'info';
  read: boolean;
}
