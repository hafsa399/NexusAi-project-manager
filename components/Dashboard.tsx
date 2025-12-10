
import React, { useMemo } from 'react';
import { Project, TaskStatus } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';

interface DashboardProps {
  projects: Project[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export const Dashboard: React.FC<DashboardProps> = ({ projects }) => {
  
  const stats = useMemo(() => {
    const totalProjects = projects.length;
    const activeProjects = projects.filter(p => p.progress < 100).length;
    const totalTasks = projects.reduce((acc, p) => acc + p.tasks.length, 0);
    const completedTasks = projects.reduce((acc, p) => acc + p.tasks.filter(t => t.status === TaskStatus.Completed).length, 0);
    const overallProgress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
    const totalBudget = projects.reduce((acc, p) => acc + p.budget, 0);

    return { totalProjects, activeProjects, totalTasks, completedTasks, overallProgress, totalBudget };
  }, [projects]);

  const taskDistribution = useMemo(() => {
    let pending = 0, inProgress = 0, completed = 0, blocked = 0;
    projects.forEach(p => {
      p.tasks.forEach(t => {
        if (t.status === TaskStatus.Pending) pending++;
        else if (t.status === TaskStatus.InProgress) inProgress++;
        else if (t.status === TaskStatus.Completed) completed++;
        else if (t.status === TaskStatus.Blocked) blocked++;
      });
    });
    return [
      { name: 'Pending', value: pending },
      { name: 'In Progress', value: inProgress },
      { name: 'Completed', value: completed },
      { name: 'Blocked', value: blocked },
    ].filter(item => item.value > 0);
  }, [projects]);

  const projectHealthData = projects.map(p => ({
    name: p.name.length > 10 ? p.name.substring(0, 10) + '...' : p.name,
    progress: p.progress,
    tasks: p.tasks.length
  }));

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in max-w-[1600px] mx-auto overflow-y-auto h-full text-slate-900 dark:text-slate-100">
      <h2 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white">Executive Overview</h2>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Active Projects</p>
          <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{stats.activeProjects}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Global Progress</p>
          <p className="text-3xl font-bold text-emerald-500 dark:text-emerald-400">{stats.overallProgress}%</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Budget</p>
          <p className="text-3xl font-bold text-slate-700 dark:text-slate-200">${stats.totalBudget.toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Tasks</p>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.totalTasks}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">
        {/* Task Distribution Chart */}
        <div className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col h-80 md:h-96">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4" id="task-dist-chart-title">Task Status Distribution</h3>
            <div className="flex-1 w-full min-h-0" role="img" aria-labelledby="task-dist-chart-title">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={taskDistribution}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            fill="#8884d8"
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {taskDistribution.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }} />
                        <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Project Progress Chart */}
        <div className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col h-80 md:h-96">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4" id="project-health-chart-title">Project progress</h3>
            <div className="flex-1 w-full min-h-0" role="img" aria-labelledby="project-health-chart-title">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={projectHealthData} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#475569" />
                        <XAxis dataKey="name" tick={{fontSize: 12, fill: '#94a3b8'}} />
                        <YAxis tick={{fontSize: 12, fill: '#94a3b8'}} />
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                        <Bar dataKey="progress" fill="#6366f1" radius={[4, 4, 0, 0]} name="Progress (%)" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>
    </div>
  );
};
