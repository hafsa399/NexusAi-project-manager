
import React, { useState, useRef, useEffect } from 'react';
import { parseProjectInput, transcribeAudio } from '../services/geminiService';
import { Project, TaskStatus, Priority, TeamMember } from '../types';

interface ProjectCreateProps {
  onProjectCreated: (project: Project) => void;
  onCancel: () => void;
  teamMembers: TeamMember[];
}

const SUPPORTED_LANGUAGES = [
  'English', 'Spanish', 'French', 'German', 'Portuguese', 'Japanese', 'Korean', 'Hindi'
];

export const ProjectCreate: React.FC<ProjectCreateProps> = ({ onProjectCreated, onCancel, teamMembers }) => {
  // Load draft from localStorage if available
  const [inputText, setInputText] = useState(() => {
    return localStorage.getItem('nexus_create_project_draft') || '';
  });
  
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  
  // States
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Auto-save draft
  useEffect(() => {
    localStorage.setItem('nexus_create_project_draft', inputText);
  }, [inputText]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Mic access denied", err);
      alert("Could not access microphone. Please allow permissions.");
    }
  };

  const stopRecording = async () => {
    if (!mediaRecorderRef.current) return;
    
    setIsRecording(false);
    
    mediaRecorderRef.current.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
      const reader = new FileReader();
      
      setIsTranscribing(true);
      
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        try {
          const base64Audio = (reader.result as string).split(',')[1];
          const text = await transcribeAudio(base64Audio, selectedLanguage);
          
          // Append new text to existing text (with a space if needed)
          setInputText(prev => {
             const spacer = prev.trim().length > 0 ? '\n\n' : '';
             return prev + spacer + text;
          });
        } catch (e) {
          alert("Could not transcribe audio. Please try again.");
        } finally {
          setIsTranscribing(false);
        }
      };
      
      // Stop all tracks to release mic
      mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
    };

    mediaRecorderRef.current.stop();
  };

  const handleGenerate = async () => {
    if (!inputText.trim()) return;
    
    setIsGenerating(true);
    try {
      // Pass team members to AI to help with assignment
      const result = await parseProjectInput({ text: inputText }, teamMembers);
      
      // Validate dates
      const today = new Date();
      let startDate = result.startDate || today.toISOString().split('T')[0];
      let endDate = result.endDate;

      if (!endDate) {
         const d = new Date(startDate);
         d.setDate(d.getDate() + 30);
         endDate = d.toISOString().split('T')[0];
      }

      // Convert raw AI result to our Project Type
      const newProject: Project = {
        id: crypto.randomUUID(),
        name: result.name,
        description: result.description,
        startDate: startDate,
        endDate: endDate,
        budget: result.budget || 0,
        techStack: result.techStack || [],
        tasks: (result.tasks || []).map((t: any) => {
          // Ensure task deadline is valid if present
          let taskDeadline = t.deadline;
          if (taskDeadline) {
             const d = new Date(taskDeadline);
             if (isNaN(d.getTime())) taskDeadline = undefined;
          }

          // Verify assignee exists in our team
          let assigneeId = t.assigneeId;
          if (assigneeId && !teamMembers.find(m => m.id === assigneeId)) {
            assigneeId = undefined; // Reset if invalid ID
          }

          return {
            id: crypto.randomUUID(),
            title: t.title,
            description: t.description || "",
            status: TaskStatus.Pending,
            priority: (t.priority as Priority) || Priority.Medium,
            estimatedHours: t.estimatedHours || 4,
            deadline: taskDeadline,
            assigneeId: assigneeId,
            history: [{
                id: crypto.randomUUID(),
                changeType: 'CREATED',
                description: 'Task created via AI',
                timestamp: new Date().toISOString(),
                actorName: 'AI Agent'
            }]
          };
        }),
        team: teamMembers, 
        risks: [],
        progress: 0
      };

      onProjectCreated(newProject);
      // Clear draft only on success
      setInputText('');
      localStorage.removeItem('nexus_create_project_draft');
    } catch (error) {
      console.error(error);
      alert("Failed to generate project. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden h-full flex flex-col transition-colors duration-200">
      <div className="bg-indigo-600 p-4 md:p-6 flex-shrink-0">
        <h2 className="text-xl md:text-2xl font-bold text-white">Create New Project</h2>
        <p className="text-indigo-100 mt-2 text-sm md:text-base">Speak or type your project details. Review the text, then generate the plan.</p>
      </div>
      
      <div className="p-4 md:p-8 flex-1 flex flex-col min-h-0 overflow-y-auto">
        
        {/* Loading State Overlay */}
        {isGenerating && (
           <div className="absolute inset-0 bg-white/90 dark:bg-slate-900/90 z-50 flex flex-col items-center justify-center p-4">
             <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-indigo-600 mb-4" role="status"></div>
             <p className="text-xl text-slate-800 dark:text-slate-100 font-bold animate-pulse">Building Project Plan...</p>
             <p className="text-slate-500 dark:text-slate-400 mt-2">Analyzing requirements, assigning team members, and estimating timelines.</p>
           </div>
        )}

        {/* Tools Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
           <div className="flex items-center gap-2">
              <label htmlFor="language-select" className="text-sm font-medium text-slate-600 dark:text-slate-300">Language:</label>
              <select 
                id="language-select"
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-1.5 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                {SUPPORTED_LANGUAGES.map(lang => <option key={lang} value={lang}>{lang}</option>)}
              </select>
           </div>
           
           <div className="flex gap-2">
              <button 
                onClick={() => { setInputText(''); localStorage.removeItem('nexus_create_project_draft'); }}
                className="text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 text-sm font-medium px-3 py-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                disabled={!inputText}
              >
                Clear Text
              </button>
           </div>
        </div>

        {/* Main Input Area */}
        <div className="relative flex-1 mb-6 group">
           <textarea
             className={`w-full h-full min-h-[200px] p-6 text-lg leading-relaxed border-2 rounded-xl outline-none resize-none transition-all
               bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400
               ${isRecording ? 'border-red-400 bg-red-50/30 dark:bg-red-900/10' : 'border-slate-200 dark:border-slate-700 focus:border-indigo-500 dark:focus:border-indigo-500'}
               ${isTranscribing ? 'opacity-70 cursor-wait' : ''}
             `}
             placeholder="Tap the microphone to start speaking, or type your project description here..."
             value={inputText}
             onChange={(e) => setInputText(e.target.value)}
             disabled={isTranscribing || isGenerating}
           />
           
           {/* Transcribing Indicator */}
           {isTranscribing && (
             <div className="absolute bottom-4 right-4 bg-indigo-600 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2 animate-bounce">
                <span className="w-2 h-2 bg-white rounded-full"></span>
                Transcribing Audio...
             </div>
           )}
           
           {/* Recording Indicator */}
           {isRecording && (
             <div className="absolute top-4 right-4 flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
                <span className="text-red-500 dark:text-red-400 font-bold text-sm tracking-wide">LISTENING</span>
             </div>
           )}
        </div>

        {/* Control Bar */}
        <div className="flex flex-col md:flex-row items-center gap-4 border-t border-slate-100 dark:border-slate-700 pt-6">
           
           {/* Mic Button */}
           <button
             onClick={isRecording ? stopRecording : startRecording}
             className={`flex items-center gap-3 px-6 py-3 rounded-full font-bold shadow-md transition-all active:scale-95
               ${isRecording 
                 ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse shadow-red-200 dark:shadow-red-900/20' 
                 : 'bg-slate-800 hover:bg-slate-900 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white'
               }
             `}
           >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               {isRecording ? (
                 <rect x="6" y="6" width="12" height="12" fill="currentColor" />
               ) : (
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
               )}
             </svg>
             {isRecording ? "Stop Listening" : "Start Voice Input"}
           </button>

           <div className="flex-1"></div>

           {/* Action Buttons */}
           <button onClick={onCancel} className="px-5 py-3 text-slate-500 dark:text-slate-400 font-medium hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
             Cancel
           </button>
           
           <button
             onClick={handleGenerate}
             disabled={!inputText.trim() || isRecording || isTranscribing}
             className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
           >
             <span>Generate Plan</span>
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
           </button>

        </div>
      </div>
    </div>
  );
};
