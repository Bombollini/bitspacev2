import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    
    // Create Supabase client with user's Auth context for RLS policies
    const supabase = createClient(supabaseUrl!, supabaseAnonKey!, {
      global: { headers: { Authorization: authHeader || '' } },
    });

    const callGemini = async (prompt: string, expectJson = false): Promise<string> => {
       const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
       const requestBody = {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: expectJson ? { responseMimeType: "application/json" } : undefined
       };

       const response = await fetch(url, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(requestBody)
       });

       if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Gemini API Error: ${errText}`);
       }

       const json = await response.json();
       return json.candidates?.[0]?.content?.parts?.[0]?.text || "";
    };

    let result: any;

    if (action === "summarize_project") {
        const { data: { tasks, activities } } = payload;
        const prompt = `You are an AI Project Manager. Summarize the project status based on these tasks and activities. Give a short, concise markdown report focusing on progress, recent milestones, and blockers.\n\nTasks:\n${JSON.stringify(tasks, null, 2)}\n\nRecent Activities:\n${JSON.stringify(activities, null, 2)}`;
        result = await callGemini(prompt);
    } 
    else if (action === "generate_project_plan") {
        const { projectId, projectName, description } = payload;
        const prompt = `You are an expert project manager. Your goal is to create a specialized, highly accurate, and highly specific project plan.
        
        Project Name: "${projectName}"
        Project Description: "${description || "No description provided. Please deduce the context strictly from the project name."}"
        
        INSTRUCTIONS:
        1. Analyze the Project Name AND Project Description deeply to understand the exact context, industry, and goals of this specific project.
        2. Create a realistic plan containing typically 3-4 milestones, with 2-3 actionable tasks each.
        3. Every single milestone title and task title MUST be highly specific to the context provided above. NO generic "Phase 1 / Setup Database" fallback text unless it perfectly matches the project description.
        
        Return ONLY a raw JSON array of milestones. Each milestone must have:
        - title: string 
        - description: string
        - tasks: array of objects { title: string, description: string }
        
        Do not use markdown formatting blocks (like \`\`\`json). Just return the raw JSON array: [ { ... } ].`;
        
        let jsonText = await callGemini(prompt, true);
        
        // Remove markdown formatting if Gemini still included it
        jsonText = jsonText.replace(/```json/g, "").replace(/```/g, "").trim();
        const milestones = JSON.parse(jsonText);

        // Insert milestones and tasks with calculated due dates
        let baseDate = new Date();
        for (const [mIndex, m] of milestones.entries()) {
             baseDate.setDate(baseDate.getDate() + 7); // each milestone 1 week apart
             const { data: mData, error: mErr } = await supabase
                .from('milestones')
                .insert({
                   project_id: projectId,
                   title: m.title,
                   description: m.description,
                   due_date: new Date(baseDate).toISOString(),
                   status: 'OPEN'
                })
                .select()
                .single();
             
             if (mErr) throw new Error("Failed to insert milestone: " + mErr.message);
             
             for (const t of m.tasks) {
                 const { error: tErr } = await supabase
                   .from('tasks')
                   .insert({
                     project_id: projectId,
                     milestone_id: mData.id,
                     title: t.title,
                     description: t.description,
                     status: 'BACKLOG',
                     priority: 'MEDIUM',
                   });
                 if (tErr) throw new Error("Failed to insert task: " + tErr.message);
             }
        }
        result = "Plan generated and inserted successfully";
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
    return new Response(JSON.stringify({ error: error.message, stack: error.stack }), {
      status: 200, // Returning 200 instead of 400 helps us debug it on frontend
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
