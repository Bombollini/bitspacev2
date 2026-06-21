import {
  AIProjectGeneratorRequest,
  AIGeneratedProject,
  AIGeneratedMilestone,
  AIGeneratedTask,
  TaskPriority,
} from '../types';

/**
 * Bitspace AI Service
 * Handles integration with Google Gemini AI for project generation and analysis
 */

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

export class AIService {
  /**
   * Generate a project with milestones and tasks using AI
   * @param request Project generation request with user prompt, team size, and deadline
   * @returns AI-generated project structure
   */
  static async generateProject(request: AIProjectGeneratorRequest): Promise<AIGeneratedProject> {
    if (!GEMINI_API_KEY) {
      throw new Error(
        'Gemini API key is not configured. Please set VITE_GEMINI_API_KEY in your environment.'
      );
    }

    const prompt = this.buildProjectGenerationPrompt(request);

    try {
      const response = await fetch(`${GEMINI_API_BASE}/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192,
            responseMimeType: "application/json",
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `Gemini API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`
        );
      }

      const data = await response.json();
      
      // Handle different response structures
      let generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text 
        || data?.contents?.[0]?.parts?.[0]?.text 
        || data?.text;

      if (!generatedText) {
        console.error('Unexpected response structure:', JSON.stringify(data, null, 2));
        throw new Error('Unexpected response structure from Gemini API');
      }

      const generatedProject = this.parseJsonResponse(generatedText);
      return this.validateAndMapResponse(generatedProject, request);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`AI Project Generation failed: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Robustly parse JSON from AI response text.
   * Tries direct parse first (works when responseMimeType=application/json),
   * then strips markdown fences, then falls back to regex extraction.
   */
  private static parseJsonResponse(text: string): any {
    const cleaned = text.trim();

    // Strategy 1: direct parse (ideal when responseMimeType is set)
    try {
      return JSON.parse(cleaned);
    } catch {
      // continue to next strategy
    }

    // Strategy 2: strip markdown code fences ```json ... ``` or ``` ... ```
    const fenceStripped = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    try {
      return JSON.parse(fenceStripped);
    } catch {
      // continue to next strategy
    }

    // Strategy 3: extract first {...} block (handles leading/trailing text)
    const jsonMatch = fenceStripped.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch {
        // fall through to final error
      }
    }

    throw new Error(
      'Could not parse AI response as JSON. Response was: ' + cleaned.substring(0, 300)
    );
  }

  /**
   * Build prompt for project generation
   */
  private static buildProjectGenerationPrompt(request: AIProjectGeneratorRequest): string {
    return `You are an expert project manager and software architect. Generate a detailed project plan based on the following requirements:

User Prompt: "${request.prompt}"
Team Size: ${request.teamSize} people
Project Deadline: ${request.deadline}

Please generate a JSON response with the following structure:
{
  "name": "Project Name",
  "description": "A comprehensive project description",
  "projectGoal": "The main goal of the project",
  "teamSize": ${request.teamSize},
  "deadline": "${request.deadline}",
  "milestones": [
    {
      "title": "Milestone 1",
      "description": "Description of what will be accomplished",
      "dueDate": "2026-07-15",
      "order": 1
    }
  ],
  "tasks": [
    {
      "title": "Task 1",
      "description": "Detailed task description",
      "priority": "HIGH",
      "estimatedDays": 5,
      "milestoneIndex": 0
    }
  ]
}

Requirements for the JSON response:
1. Generate 3-5 realistic milestones
2. Generate 10-20 actionable tasks
3. Distribute tasks across milestones
4. Use realistic priorities (LOW, MEDIUM, HIGH)
5. Include estimated effort in days
6. Ensure deadlines are realistic and before the project deadline
7. Make the project plan detailed and professional

IMPORTANT: Return ONLY valid JSON, no additional text or markdown formatting.`;
  }

  /**
   * Validate and map Gemini response to our format
   */
  private static validateAndMapResponse(
    response: any,
    request: AIProjectGeneratorRequest
  ): AIGeneratedProject {
    const validPriorities = ['LOW', 'MEDIUM', 'HIGH'];

    // Validate required fields
    if (!response.name || typeof response.name !== 'string') {
      throw new Error('Invalid response: missing or invalid project name');
    }

    if (!Array.isArray(response.milestones)) {
      throw new Error('Invalid response: milestones must be an array');
    }

    if (!Array.isArray(response.tasks)) {
      throw new Error('Invalid response: tasks must be an array');
    }

    // Map and validate milestones
    const mappedMilestones: AIGeneratedMilestone[] = response.milestones.map(
      (m: any, index: number) => ({
        title: String(m.title || `Milestone ${index + 1}`),
        description: m.description ? String(m.description) : undefined,
        dueDate: m.dueDate ? String(m.dueDate) : undefined,
        order: index,
      })
    );

    // Map and validate tasks
    const mappedTasks: AIGeneratedTask[] = response.tasks.map((t: any) => ({
      title: String(t.title || 'Untitled Task'),
      description: t.description ? String(t.description) : undefined,
      priority: validPriorities.includes(t.priority) ? t.priority : TaskPriority.MEDIUM,
      estimatedDays: t.estimatedDays ? Math.max(1, Math.min(100, Number(t.estimatedDays))) : 3,
      milestoneIndex:
        typeof t.milestoneIndex === 'number' && t.milestoneIndex < mappedMilestones.length
          ? t.milestoneIndex
          : undefined,
    }));

    return {
      name: response.name,
      description: response.description ? String(response.description) : '',
      projectGoal: response.projectGoal ? String(response.projectGoal) : request.prompt,
      teamSize: request.teamSize,
      deadline: request.deadline,
      milestones: mappedMilestones,
      tasks: mappedTasks,
    };
  }

  /**
   * Generate task breakdown/subtasks for a task
   * This can be used for Phase 2: AI Task Breakdown
   */
  static async generateTaskBreakdown(
    taskTitle: string,
    taskDescription: string,
    projectContext: string
  ): Promise<{ subtasks: { title: string, description: string, estimatedDays: number }[]; acceptanceCriteria: string[] }> {
    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API key is not configured');
    }

    const prompt = `As a project manager, break down this task into smaller actionable subtasks and define acceptance criteria.

Task: "${taskTitle}"
Description: "${taskDescription}"
Project Context: "${projectContext}"

Return JSON:
{
  "subtasks": [
    {
      "title": "Subtask title",
      "description": "Detailed description of the subtask",
      "estimatedDays": 1
    }
  ],
  "acceptanceCriteria": ["criteria 1", "criteria 2", ...]
}

IMPORTANT: Return ONLY valid JSON.`;

    try {
      const response = await fetch(`${GEMINI_API_BASE}/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 2048, responseMimeType: "application/json" },
        }),
      });

      if (!response.ok) throw new Error('Gemini API call failed');

      const data = await response.json();
      
      let responseText = data?.candidates?.[0]?.content?.parts?.[0]?.text
        || data?.contents?.[0]?.parts?.[0]?.text
        || data?.text;
      
      return this.parseJsonResponse(responseText);
    } catch (error) {
      console.error('Task breakdown generation failed:', error);
      throw error;
    }
  }

  /**
   * Analyze project health and generate insights
   * This can be used for Phase 3: AI Smart Project Monitoring
   */
  static async analyzeProjectHealth(projectData: {
    name: string;
    description: string;
    totalTasks: number;
    completedTasks: number;
    overdueTasks: number;
    teamSize: number;
  }): Promise<{
    healthScore: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    recommendations: string[];
    delayPrediction: string;
    bottlenecks: string[];
  }> {
    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API key is not configured');
    }

    const completionRate = ((projectData.completedTasks / projectData.totalTasks) * 100).toFixed(1);
    const overduePercentage = ((projectData.overdueTasks / projectData.totalTasks) * 100).toFixed(1);

    const prompt = `Analyze this project's health and respond ONLY with a valid JSON object.

Project: ${projectData.name}
Description: ${projectData.description}
Total Tasks: ${projectData.totalTasks}
Completed: ${projectData.completedTasks} (${completionRate}%)
Overdue: ${projectData.overdueTasks} (${overduePercentage}%)
Team Size: ${projectData.teamSize}

Respond with this exact JSON structure (no extra text, no markdown):
{
  "healthScore": <integer 0-100>,
  "riskLevel": <"LOW"|"MEDIUM"|"HIGH">,
  "recommendations": [<up to 3 short strings, max 12 words each>],
  "delayPrediction": <one sentence>,
  "bottlenecks": [<up to 3 short strings, max 12 words each>]
}`;

    try {
      const response = await fetch(`${GEMINI_API_BASE}/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.5, maxOutputTokens: 2048, responseMimeType: "application/json" },
        }),
      });

      if (!response.ok) throw new Error('Gemini API call failed');

      const data = await response.json();
      
      let responseText = data?.candidates?.[0]?.content?.parts?.[0]?.text
        || data?.contents?.[0]?.parts?.[0]?.text
        || data?.text;
      
      const result = this.parseJsonResponse(responseText);
      return {
        healthScore: Math.max(0, Math.min(100, result.healthScore || 50)),
        riskLevel: ['LOW', 'MEDIUM', 'HIGH'].includes(result.riskLevel)
          ? result.riskLevel
          : 'MEDIUM',
        recommendations: Array.isArray(result.recommendations) ? result.recommendations : [],
        delayPrediction: result.delayPrediction || "No prediction available.",
        bottlenecks: Array.isArray(result.bottlenecks) ? result.bottlenecks : [],
      };
    } catch (error) {
      console.error('Project health analysis failed:', error);
      throw new Error('Failed to analyze project health');
    }
  }

  static async summarizeMeeting(notes: string, members: { id: string; name: string; role: string }[]): Promise<{
    summary: string;
    keyDecisions: string[];
    actionItems: {
      taskTitle: string;
      description: string;
      suggestedAssigneeId?: string;
    }[];
  }> {
    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API key is not configured');
    }

    const membersJson = JSON.stringify(members);
    const prompt = `You are an AI meeting assistant. Read the following raw meeting notes and generate a structured summary, extracting key decisions and action items. 
For each action item, suggest an assignee from the provided team members list based on their role and name, or leave it empty if no obvious match is found.

Raw Meeting Notes:
${notes}

Team Members:
${membersJson}

Return ONLY valid JSON matching this structure exactly:
{
  "summary": "A 2-3 sentence overview of the meeting.",
  "keyDecisions": ["Decision 1", "Decision 2"],
  "actionItems": [
    {
      "taskTitle": "Clear, concise title for the task",
      "description": "More detailed description of what needs to be done",
      "suggestedAssigneeId": "UUID of the suggested team member, or null"
    }
  ]
}

IMPORTANT:
- Return valid JSON only. Do not wrap in markdown tags like \`\`\`json.
- The suggestedAssigneeId MUST exactly match the id field of one of the provided Team Members, or be null.`;

    try {
      const response = await fetch(
        `${GEMINI_API_BASE}/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.2,
              responseMimeType: "application/json",
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      
      let textResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text
        || data?.contents?.[0]?.parts?.[0]?.text
        || data?.text;

      if (!textResponse) {
        throw new Error('Invalid response from AI');
      }

      const result = this.parseJsonResponse(textResponse);

      return {
        summary: result.summary || "No summary provided.",
        keyDecisions: Array.isArray(result.keyDecisions) ? result.keyDecisions : [],
        actionItems: Array.isArray(result.actionItems) ? result.actionItems : [],
      };
    } catch (error) {
      console.error('Meeting summarization failed:', error);
      throw new Error('Failed to summarize meeting');
    }
  }

  static async generateSprintReport(
    projectData: { name: string; description: string; status: string },
    tasks: { title: string; status: string; dueDate?: string }[],
    activities: { action: string; createdAt: string; user?: { name: string } }[]
  ): Promise<string> {
    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API key is not configured');
    }

    const completedTasks = tasks.filter(t => t.status === 'DONE');
    const overdueTasks = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'DONE');
    const inProgressTasks = tasks.filter(t => t.status !== 'DONE' && t.status !== 'BACKLOG');

    const prompt = `You are an expert Agile Scrum Master and Project Manager. Generate a comprehensive "Sprint Status Report" for the following project.
The report should be formatted in clean, professional Markdown.

Project Details:
- Name: ${projectData.name}
- Description: ${projectData.description}
- Status: ${projectData.status}

Metrics:
- Total Tasks: ${tasks.length}
- Completed Tasks: ${completedTasks.length}
- In Progress Tasks: ${inProgressTasks.length}
- Overdue Tasks: ${overdueTasks.length}

Recent Activities:
${activities.slice(0, 20).map(a => `- ${a.user?.name || 'System'} ${a.action} on ${new Date(a.createdAt).toLocaleDateString()}`).join('\n')}

Based on the data above, generate a professional Sprint Status Report with the following sections:
1. **Executive Summary**: A brief, high-level summary of the current project status.
2. **Progress Overview**: An analysis of completed vs remaining work.
3. **Risks & Blockers**: Identify any potential risks, especially focusing on overdue tasks.
4. **Key Recommendations**: 3-5 actionable recommendations to improve project velocity and health.

Return ONLY the Markdown text.`;

    try {
      const response = await fetch(
        `${GEMINI_API_BASE}/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.4,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      const textResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text
        || data?.contents?.[0]?.parts?.[0]?.text
        || data?.text;

      if (!textResponse) {
        throw new Error('Invalid response from AI');
      }

      return textResponse;
    } catch (error) {
      console.error('Sprint report generation failed:', error);
      throw new Error('Failed to generate sprint report');
    }
  }

  static async chatWithWorkspace(
    message: string,
    history: { role: 'user' | 'model'; parts: { text: string }[] }[],
    projectContext: {
      project: any;
      tasks: any[];
      members: any[];
    }
  ): Promise<string> {
    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API key is not configured');
    }

    const systemContext = `You are Bitspace AI, a helpful project management assistant for the Bitora Protocol platform.
You have access to the following project context. Answer the user's questions based on this data. Be concise, helpful, and professional.

PROJECT CONTEXT:
Name: ${projectContext.project?.name}
Description: ${projectContext.project?.description}
Status: ${projectContext.project?.status}

MEMBERS:
${projectContext.members.map((m: any) => `- ${m.name} (${m.role})`).join('\n')}

TASKS SUMMARY:
Total Tasks: ${projectContext.tasks.length}
Completed: ${projectContext.tasks.filter((t: any) => t.status === 'DONE').length}
In Progress: ${projectContext.tasks.filter((t: any) => t.status === 'IN_PROGRESS').length}
Overdue: ${projectContext.tasks.filter((t: any) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'DONE').length}

Please answer the following user message using the context above. If they ask about something not in the context, politely let them know you only have access to the current project data.`;

    try {
      // Build messages array for Gemini
      // Note: For gemini-1.5-pro, we can pass a system instruction or just prepend it to the first user message.
      // We'll prepend the systemContext to the newest message to ensure it has context.
      const promptText = `${systemContext}\n\nUSER MESSAGE:\n${message}`;

      const contents = [
        ...history,
        {
          role: 'user',
          parts: [{ text: promptText }],
        }
      ];

      const response = await fetch(
        `${GEMINI_API_BASE}/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents,
            generationConfig: {
              temperature: 0.7,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      const textResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text
        || data?.contents?.[0]?.parts?.[0]?.text
        || data?.text;

      if (!textResponse) {
        throw new Error('Invalid response from AI');
      }

      return textResponse;
    } catch (error) {
      console.error('Workspace chat failed:', error);
      throw new Error('Failed to chat with workspace AI');
    }
  }
}
