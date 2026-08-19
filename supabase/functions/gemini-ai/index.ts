import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const parseJsonSafely = (text: string): any => {
  let cleaned = text.trim();
  cleaned = cleaned.replace(/\\`/g, "`").replace(/\\'/g, "'");

  try {
    return JSON.parse(cleaned);
  } catch { /* fallthrough */ }

  const fenceStripped = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  try {
    return JSON.parse(fenceStripped);
  } catch { /* fallthrough */ }

  const jsonMatch = fenceStripped.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try { return JSON.parse(jsonMatch[0]); } catch { /* fallthrough */ }
  }

  const arrayMatch = fenceStripped.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    try { return JSON.parse(arrayMatch[0]); } catch { /* fallthrough */ }
  }

  throw new Error('Could not parse AI response as JSON. Response was: ' + cleaned.substring(0, 300));
};

const extractMilestonesArray = (parsed: any): any[] => {
  if (Array.isArray(parsed)) return parsed;
  if (parsed && Array.isArray(parsed.milestones)) return parsed.milestones;
  if (parsed && parsed.data && Array.isArray(parsed.data.milestones)) return parsed.data.milestones;
  throw new Error("AI returned an unexpected format — expected a JSON array of milestones.");
};

const validateMilestones = (milestones: any[]): void => {
  if (!Array.isArray(milestones)) {
    throw new Error("Expected milestones to be an array.");
  }
  if (milestones.length === 0) {
    throw new Error("AI returned an empty milestones list.");
  }
  for (const [i, m] of milestones.entries()) {
    if (!m || typeof m !== "object") {
      throw new Error(`Milestone at index ${i} is not an object.`);
    }
    if (!m.title || typeof m.title !== "string") {
      throw new Error(`Milestone at index ${i} is missing a valid "title" string.`);
    }
    if (!Array.isArray(m.tasks)) {
      throw new Error(`Milestone "${m.title}" is missing a valid "tasks" array.`);
    }
    for (const [j, t] of m.tasks.entries()) {
      if (!t || typeof t !== "object" || !t.title || typeof t.title !== "string") {
        throw new Error(`Task at index ${j} of milestone "${m.title}" is missing a valid "title" string.`);
      }
    }
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { action, ...payload } = await req.json();
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set in Edge Function secrets.");
    }

    const authHeader = req.headers.get('Authorization');
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("SUPABASE_URL or SUPABASE_ANON_KEY is not set in Edge Function secrets.");
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader || '' } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error("User not authenticated. Please log in and try again.");
    }

    const callGemini = async (prompt: string, expectJson = false): Promise<string> => {
       const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
       const requestBody: any = {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: expectJson ? { responseMimeType: "application/json", temperature: 0.7, maxOutputTokens: 8192 } : { temperature: 0.7 }
       };

       const response = await fetch(url, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(requestBody)
       });

       if (!response.ok) {
          let errText = `HTTP ${response.status}`;
          try {
            const errJson = await response.json();
            errText = errJson?.error?.message || errText;
          } catch {
            try { errText = await response.text(); } catch { /* use default */ }
          }
          throw new Error(`Gemini API Error: ${errText}`);
       }

       const json = await response.json();
       const text = json.candidates?.[0]?.content?.parts?.[0]?.text
         || json.contents?.[0]?.parts?.[0]?.text
         || json.text
         || "";
       
       if (!text) {
         console.error("Empty Gemini response:", JSON.stringify(json));
         throw new Error("Gemini AI returned an empty response. Please try again.");
       }
       return text;
    };

    let result: any;

    if (action === "summarize_project") {
        const { data: { tasks, activities } } = payload;
        const prompt = `You are an AI Project Manager. Summarize the project status based on these tasks and activities. Give a short, concise markdown report focusing on progress, recent milestones, and blockers.\n\nTasks:\n${JSON.stringify(tasks, null, 2)}\n\nRecent Activities:\n${JSON.stringify(activities, null, 2)}`;
        result = await callGemini(prompt);
    } 
    else if (action === "generate_project_plan") {
        const { projectId, projectName, description } = payload;

        if (!projectId || typeof projectId !== "string") {
          throw new Error("Invalid or missing projectId in request.");
        }
        if (!projectName || typeof projectName !== "string") {
          throw new Error("Invalid or missing projectName in request.");
        }

        const prompt = `You are an expert project manager. Your goal is to create a specialized, highly accurate, and highly specific project plan.
        
Project Name: "${projectName}"
Project Description: "${description || "No description provided. Please deduce the context strictly from the project name."}"

INSTRUCTIONS:
1. Analyze the Project Name AND Project Description deeply to understand the exact context, industry, and goals of this specific project.
2. Create a realistic plan containing typically 3-4 milestones, with 2-3 actionable tasks each.
3. Every single milestone title and task title MUST be highly specific to the context provided above. NO generic "Phase 1 / Setup Database" fallback text unless it perfectly matches the project description.

Return ONLY valid JSON matching this structure:
[
  {
    "title": "Milestone 1 title",
    "description": "Milestone 1 description",
    "tasks": [
      { "title": "Task 1 title", "description": "Task 1 description" }
    ]
  }
]

Do NOT wrap the JSON in markdown code blocks. Do NOT include any text outside the JSON array.`;
        
        const jsonText = await callGemini(prompt, true);
        const parsed = parseJsonSafely(jsonText);
        const milestones = extractMilestonesArray(parsed);
        validateMilestones(milestones);

        let baseDate = new Date();
        const createdMilestoneIds: string[] = [];
        const createdTaskTitles: string[] = [];

        for (const m of milestones) {
          baseDate.setDate(baseDate.getDate() + 7);
          const milestoneDesc = m.description ? String(m.description) : "";

          const { data: mData, error: mErr } = await supabase
            .from('milestones')
            .insert({
              project_id: projectId,
              title: String(m.title),
              description: milestoneDesc,
              due_date: new Date(baseDate).toISOString(),
              status: 'OPEN'
            })
            .select()
            .single();

          if (mErr) throw new Error("Failed to insert milestone \"" + m.title + "\": " + mErr.message);
          createdMilestoneIds.push(mData.id);

          for (const t of m.tasks) {
            const taskDesc = t.description ? String(t.description) : "";
            const { error: tErr } = await supabase
              .from('tasks')
              .insert({
                project_id: projectId,
                milestone_id: mData.id,
                title: String(t.title),
                description: taskDesc,
                status: 'BACKLOG',
                priority: 'MEDIUM',
              });
            if (tErr) throw new Error("Failed to insert task \"" + t.title + "\": " + tErr.message);
            createdTaskTitles.push(String(t.title));
          }
        }

        try {
          await supabase.from("activities").insert({
            project_id: projectId,
            user_id: user.id,
            action_type: "TASK_CREATED",
            entity_type: "PROJECT",
            entity_id: projectId,
            metadata: {
              source: "AI_AUTO_PLAN",
              milestoneCount: createdMilestoneIds.length,
              taskCount: createdTaskTitles.length,
              tasks: createdTaskTitles
            },
          });
        } catch (actErr) {
          console.error("Failed to log activity, but plan was created:", actErr);
        }

        result = {
          message: "Plan generated and inserted successfully",
          milestoneCount: createdMilestoneIds.length,
          taskCount: createdTaskTitles.length,
        };
    }
    else if (action === "generate_task_description") {
        const { title } = payload;
        const prompt = `Write a short, professional, and actionable description (2-4 sentences max) for a software engineering/management task titled: "${title}".`;
        result = await callGemini(prompt);
    }
    else if (action === "polish_text") {
        const { text } = payload;
        const prompt = `Fix grammar, spelling, and improve the professional tone of the following text. Do not add conversational filler, just return the polished text. Text:\n${text}`;
        result = await callGemini(prompt);
    }
    else {
        throw new Error("Invalid action: " + action);
    }

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error("Function error:", error);
    return new Response(JSON.stringify({ error: error.message || String(error), stack: error.stack || undefined }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
