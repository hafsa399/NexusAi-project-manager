
import { User, TeamMember } from "../types";

const USERS_KEY = 'nexus_users';
const SESSION_KEY = 'nexus_session';
const TEAM_KEY = 'nexus_team';

// Simple mock hashing for demonstration (In production, use bcrypt on server)
const hashPassword = async (password: string): Promise<string> => {
  const msgBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export const authService = {
  
  async register(name: string, email: string, password: string, role: string): Promise<User> {
    const usersStr = localStorage.getItem(USERS_KEY);
    const users: User[] = usersStr ? JSON.parse(usersStr) : [];

    // Check if email exists
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error("Account with this email already exists.");
    }

    const newUser: User = {
      id: crypto.randomUUID(),
      name,
      email,
      role,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
      passwordHash: await hashPassword(password)
    };

    // Save to Users DB
    users.push(newUser);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));

    // Automatically add to Team Members so they can be assigned tasks
    const teamStr = localStorage.getItem(TEAM_KEY);
    const team: TeamMember[] = teamStr ? JSON.parse(teamStr) : [];
    
    // Only add if not already in team (by email check logic if we had email in TeamMember, but here we use ID/Name)
    // We'll add them as a new team member
    const newTeamMember: TeamMember = {
        id: newUser.id,
        name: newUser.name,
        role: newUser.role,
        skills: ['General'], // Default skill
        avatar: newUser.avatar!
    };
    
    // Update team storage
    localStorage.setItem(TEAM_KEY, JSON.stringify([...team, newTeamMember]));

    return this.login(email, password);
  },

  async login(email: string, password: string): Promise<User> {
    const usersStr = localStorage.getItem(USERS_KEY);
    const users: User[] = usersStr ? JSON.parse(usersStr) : [];

    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user || !user.passwordHash) {
      throw new Error("Invalid email or password.");
    }

    const inputHash = await hashPassword(password);
    
    if (inputHash !== user.passwordHash) {
      throw new Error("Invalid email or password.");
    }

    // Create Session
    // Don't store password hash in session
    const sessionUser = { ...user };
    delete sessionUser.passwordHash;
    
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
    return sessionUser;
  },

  logout() {
    localStorage.removeItem(SESSION_KEY);
    // We do NOT clear projects/team data, preserving persistence
  },

  getCurrentUser(): User | null {
    const sessionStr = localStorage.getItem(SESSION_KEY);
    return sessionStr ? JSON.parse(sessionStr) : null;
  }
};
