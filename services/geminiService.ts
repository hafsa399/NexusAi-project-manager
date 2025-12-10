
import { GoogleGenAI, Type } from "@google/genai";
import { Project, TaskStatus, Priority, TeamMember } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const PROJECT_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    description: { type: Type.STRING },
    startDate: { type: Type.STRING, description: "YYYY-MM-DD format" },
    endDate: { type: Type.STRING, description: "YYYY-MM-DD format" },
    budget: { type: Type.NUMBER },
    techStack: { type: Type.ARRAY, items: { type: Type.STRING } },
    tasks: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          priority: { type: Type.STRING, enum: ["Low", "Medium", "High", "Critical"] },
          estimatedHours: { type: Type.NUMBER },
          deadline: { type: Type.STRING, description: "YYYY-MM-DD format. Must be in the future relative to today." },
          assigneeId: { type: Type.STRING, description: "The ID of the team member assigned to this task, if applicable." }
        },
        required: ["title", "priority", "estimatedHours"]
      }
    },
    suggestedTeamRoles: { type: Type.ARRAY, items: { type: Type.STRING } }
  },
  required: ["name", "description", "tasks"]
};

const RISK_SCHEMA = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      description: { type: Type.STRING },
      severity: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
      mitigationStrategy: { type: Type.STRING }
    },
    required: ["description", "severity", "mitigationStrategy"]
  }
};

/**
 * Transcribes audio input into text using Gemini Flash for speed.
 */
export const transcribeAudio = async (audioBase64: string, language: string = 'English') => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'audio/webm',
              data: audioBase64
            }
          },
          {
            text: `Transcribe the audio exactly as spoken in ${language}. If the audio is unclear, return "[Unclear Speech]". Do not add any other commentary.`
          }
        ]
      }
    });
    return response.text || "";
  } catch (error) {
    console.error("Transcription failed", error);
    throw new Error("Transcription failed");
  }
};

/**
 * Refines the grammar and clarity of the provided text.
 */
export const refineText = async (text: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Fix grammar, improve clarity, and fix potential typos in the following text. 
      Do not remove key details or change the original intent. 
      Keep it professional but natural.
      
      Text: "${text}"`
    });
    return response.text || text;
  } catch (error) {
    console.error("Refinement failed", error);
    return text; // Return original on failure
  }
};

export const parseProjectInput = async (input: { text?: string; audioBase64?: string; mimeType?: string }, availableTeam: TeamMember[] = []) => {
  const parts: any[] = [];
  
  // Use local date string to ensure AI context matches user's timezone "today"
  const currentDate = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD
  const currentYear = new Date().getFullYear();

  const teamContext = availableTeam.length > 0 
    ? `Available Team Members for assignment (use their exact IDs). Prioritize assigning based on skills match:
${availableTeam.map(m => `- Name: ${m.name}, ID: ${m.id}, Role: ${m.role}, Skills: ${m.skills.join(', ')}`).join('\n')}`
    : "No specific team members provided.";

  const systemInstruction = `You are a senior project manager. Analyze the request and create a structured project plan.
  
  CRITICAL RULES:
  1. Current Date: ${currentDate}. Current Year: ${currentYear}.
  2. All deadlines MUST be in the future relative to ${currentDate}. Do not use dates from ${currentYear - 1} or earlier.
  3. If a deadline is not explicitly mentioned, generate a reasonable one within the project duration.
  4. Assign tasks to the available team members provided in the context if their role and skills match the task requirements. Use the 'assigneeId' field.
  
  Context:
  ${teamContext}`;

  // Prioritize text if provided (which covers the new flow), otherwise fallback to audio (legacy support)
  if (input.text) {
    parts.push({ text: input.text });
  } else if (input.audioBase64) {
    parts.push({
      inlineData: {
        mimeType: input.mimeType || 'audio/webm',
        data: input.audioBase64
      }
    });
    parts.push({ text: "Create a detailed project plan based on this audio recording." });
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: { parts },
    config: {
      responseMimeType: 'application/json',
      responseSchema: PROJECT_SCHEMA,
      systemInstruction: systemInstruction,
      thinkingConfig: { thinkingBudget: 32768 }
    }
  });

  return JSON.parse(response.text || "{}");
};

export const analyzeProjectRisks = async (project: Project) => {
  const prompt = `Analyze this project plan for potential risks:
  Project: ${project.name}
  Description: ${project.description}
  Tech Stack: ${project.techStack.join(', ')}
  Budget: ${project.budget}
  Timeline: ${project.startDate} to ${project.endDate}
  Tasks: ${project.tasks.map(t => t.title).join(', ')}
  
  Identify top 3-5 risks with severity and mitigation strategies.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: RISK_SCHEMA,
      thinkingConfig: { thinkingBudget: 32768 }
    }
  });

  return JSON.parse(response.text || "[]");
};

export const generateSmartReport = async (project: Project) => {
  const prompt = `Generate a professional status report for:
  Project: ${project.name}
  Progress: ${project.progress}%
  Budget: ${project.budget}
  Completed Tasks: ${project.tasks.filter(t => t.status === 'Completed').length} / ${project.tasks.length}
  
  Format as a clean, professional markdown report with Executive Summary, Progress Details, and Recommendations. Use bolding and lists for readability.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      thinkingConfig: { thinkingBudget: 32768 }
    }
  });

  return response.text || "Report generation failed.";
};
