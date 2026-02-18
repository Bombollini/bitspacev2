import { supabase } from "../services/supabaseClient";

type SeedOptions = {
  projectsCount?: number;
  tasksPerProject?: number;
};

const PROJECT_NAMES = ["Neural Relay Upgrade", "Orbital Sync Layer", "Telemetry Drift Fix", "Quantum Cache Prototype", "Onboarding Sprint"];

const TASK_TITLES = ["Define scope and milestones", "Draft initial spec", "Implement core flow", "Hook up UI state", "Write basic validation", "QA pass and bugfix", "Deploy to staging"];

const STATUSES = ["BACKLOG", "TODO", "IN_PROGRESS", "REVIEW", "DONE"] as const;
const PRIORITIES = ["LOW", "MEDIUM", "HIGH"] as const;

function pick<T>(items: readonly T[], index: number): T {
  return items[index % items.length];
}

export async function seedDemoData(options: SeedOptions = {}) {
  const projectsCount = options.projectsCount ?? 3;
  const tasksPerProject = options.tasksPerProject ?? 5;

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  const currentUser = userData.user;
  if (!currentUser) throw new Error("Not authenticated");

  const now = Date.now();
  const projectsPayload = Array.from({ length: projectsCount }).map((_, i) => ({
    name: pick(PROJECT_NAMES, i) + ` #${(i + 1).toString().padStart(2, "0")}`,
    description: `Seeded demo project created at ${new Date(now).toLocaleString()}.`,
    owner_id: currentUser.id,
    status: "ACTIVE",
  }));

  const { data: projects, error: projectsError } = await supabase.from("projects").insert(projectsPayload).select("id, name");

  if (projectsError) throw projectsError;

  const tasksPayload = (projects ?? []).flatMap((project, projectIndex) =>
    Array.from({ length: tasksPerProject }).map((_, taskIndex) => {
      const status = pick(STATUSES, projectIndex + taskIndex);
      const priority = pick(PRIORITIES, projectIndex * 2 + taskIndex);
      const dueDate = new Date(now + (taskIndex + 1) * 24 * 60 * 60 * 1000).toISOString();
      return {
        project_id: project.id,
        title: pick(TASK_TITLES, taskIndex) + ` (${project.name})`,
        description: "Seeded demo task.",
        status,
        priority,
        assignee_id: currentUser.id,
        due_date: dueDate,
      };
    }),
  );

  const { error: tasksError } = await supabase.from("tasks").insert(tasksPayload);
  if (tasksError) throw tasksError;

  return {
    projectsCreated: projects?.length ?? 0,
    tasksCreated: tasksPayload.length,
  };
}
