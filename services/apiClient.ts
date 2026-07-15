import { supabase } from "./supabaseClient";
import {
  User,
  Project,
  Task,
  Activity,
  CreateProjectDto,
  UserRole,
  ProjectStatus,
  TaskStatus,
  TaskPriority,
  Comment,
  Milestone,
  CreateMilestoneDto,
  UpdateMilestoneDto,
  Meeting,
  CreateMeetingDto,
  UpdateMeetingDto,
  ProjectInsight,
} from "../types";

let cachedRole: { userId: string; role: UserRole; ts: number } | null = null;

const requireAdminOrOwner = async () => {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!user) throw new Error("Not authenticated");

  const now = Date.now();
  if (cachedRole && cachedRole.userId === user.id && now - cachedRole.ts < 30_000) {
    if (cachedRole.role !== UserRole.OWNER && cachedRole.role !== UserRole.ADMIN) {
      throw new Error("Forbidden: ADMIN or OWNER role required");
    }
    return user;
  }

  const { data: profile, error: profileError } = await supabase.from("profiles").select("role").eq("id", user.id).single();

  if (profileError) throw profileError;

  const role = (profile?.role as UserRole) || UserRole.MEMBER;
  cachedRole = { userId: user.id, role, ts: now };

  if (role !== UserRole.OWNER && role !== UserRole.ADMIN) {
    throw new Error("Forbidden: ADMIN or OWNER role required");
  }
  return user;
};

// Alias requireOwner to requireAdminOrOwner for backward compatibility
const requireOwner = requireAdminOrOwner;

// Helper to map DB snake_case to CamelCase
const mapProject = (data: any): Project => ({
  id: data.id,
  name: data.name,
  description: data.description,
  ownerId: data.owner_id,
  status: data.status as ProjectStatus,
  createdAt: data.created_at,
  updatedAt: data.updated_at,
  projectGoal: data.project_goal,
  teamSize: data.team_size,
  deadline: data.deadline,
  generatedByAI: data.generated_by_ai,
  projectContext: data.project_context,
  stats: {
    totalTasks: 0, // Needs aggregation
    completedTasks: 0, // Needs aggregation
    overdueTasks: 0, // Needs aggregation
  },
});

const mapTask = (data: any): Task => ({
  id: data.id,
  projectId: data.project_id,
  milestoneId: data.milestone_id,
  title: data.title,
  description: data.description,
  status: data.status as TaskStatus,
  priority: data.priority as TaskPriority,
  assigneeId: data.assignee_id,
  assignee: data.assignee
    ? {
        id: data.assignee.id,
        name: data.assignee.full_name,
        email: data.assignee.email,
        role: data.assignee.role,
        avatarUrl: data.assignee.avatar_url,
        createdAt: data.assignee.created_at,
      }
    : undefined,
  dueDate: data.due_date,
  attachmentUrl: data.attachment_url,
  createdAt: data.created_at,
  updatedAt: data.updated_at,
  parentTaskId: data.parent_task_id,
});

const mapComment = (data: any): Comment => ({
  id: data.id,
  taskId: data.task_id,
  userId: data.user_id,
  user: data.user
    ? {
        id: data.user.id,
        name: data.user.full_name,
        email: data.user.email,
        role: data.user.role,
        avatarUrl: data.user.avatar_url,
        createdAt: data.user.created_at,
      }
    : undefined,
  content: data.content,
  createdAt: data.created_at,
  updatedAt: data.updated_at,
});

export const api = {
  auth: {
    // Auth is handled in authStore via supabase directly usually,
    // but if we need direct calls:
    login: async (credentials: any) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });
      if (error) throw error;
      return data;
    },
    logout: async () => {
      await supabase.auth.signOut();
    },
    me: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      return data;
    },
  },
  profiles: {
    search: async (query: string): Promise<User[]> => {
      const { data, error } = await supabase.from("profiles").select("*").or(`full_name.ilike.%${query}%,email.ilike.%${query}%`).limit(10);

      if (error) throw error;

      return data.map((p: any) => ({
        id: p.id,
        name: p.full_name,
        email: p.email,
        role: p.role as UserRole,
        avatarUrl: p.avatar_url,
        createdAt: p.created_at,
      }));
    },
    uploadAvatar: async (file: File) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from("avatars").upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(fileName);

      // Update profile
      const { error: updateError } = await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", user.id);

      if (updateError) throw updateError;

      return publicUrl;
    },
  },
  projects: {
    addMember: async (projectId: string, userId: string, role: string) => {
      await requireOwner();
      const { error } = await supabase.from("project_members").insert({
        project_id: projectId,
        user_id: userId,
        role: role,
      });
      if (error) throw error;

      // Log Add Member Activity
      const currentUserId = (await supabase.auth.getUser()).data.user?.id;
      if (currentUserId) {
        await supabase.from("activities").insert({
          project_id: projectId,
          user_id: currentUserId,
          action_type: "MEMBER_ADDED",
          entity_type: "MEMBER",
          entity_id: userId,
          metadata: { role: role },
        });
      }
    },
    removeMember: async (projectId: string, userId: string) => {
      await requireOwner();
      const { error } = await supabase.from("project_members").delete().eq("project_id", projectId).eq("user_id", userId);
      if (error) throw error;

      // Log Remove Member Activity
      const currentUserId = (await supabase.auth.getUser()).data.user?.id;
      if (currentUserId) {
        await supabase.from("activities").insert({
          project_id: projectId,
          user_id: currentUserId,
          action_type: "MEMBER_REMOVED",
          entity_type: "MEMBER",
          entity_id: userId,
          metadata: {},
        });
      }
    },
    list: async (): Promise<Project[]> => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) throw new Error("Not authenticated");

      // Get user's role
      const { data: profile, error: profileError } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      if (profileError) throw profileError;
      const userRole = (profile?.role as UserRole) || UserRole.MEMBER;

      // If admin or owner, get all projects!
      if (userRole === UserRole.ADMIN || userRole === UserRole.OWNER) {
        const { data: allProjects, error: allError } = await supabase
          .from("projects")
          .select(
            `
              *,
              tasks:tasks(id, status, due_date)
          `,
          )
          .order("created_at", { ascending: false });
        if (allError) throw allError;
        return allProjects.map((p: any) => {
          const totalTasks = p.tasks?.length || 0;
          const completedTasks = p.tasks?.filter((t: any) => t.status === "DONE").length || 0;
          const overdueTasks = p.tasks?.filter((t: any) => t.due_date && new Date(t.due_date) < new Date() && t.status !== "DONE").length || 0;
          return {
            ...mapProject(p),
            stats: { totalTasks, completedTasks, overdueTasks },
          };
        });
      }

      // Get projects owned by user
      const { data: ownedProjects, error: ownedError } = await supabase
        .from("projects")
        .select(
          `
            *,
            tasks:tasks(id, status, due_date)
        `,
        )
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });

      if (ownedError) throw ownedError;

      // Get project IDs where user is a member
      const { data: memberData, error: memberError } = await supabase.from("project_members").select("project_id").eq("user_id", user.id);

      if (memberError) throw memberError;

      const memberProjectIds = memberData.map((m: any) => m.project_id);

      let memberProjects: any[] = [];
      if (memberProjectIds.length > 0) {
        const { data: fetchedMemberProjects, error: fetchError } = await supabase
          .from("projects")
          .select(
            `
              *,
              tasks:tasks(id, status, due_date)
          `,
          )
          .in("id", memberProjectIds)
          .order("created_at", { ascending: false });

        if (fetchError) throw fetchError;
        memberProjects = fetchedMemberProjects;
      }

      // Merge and deduplicate
      const allProjects = [...ownedProjects, ...memberProjects];
      const deduped = Array.from(new Map(allProjects.map((p) => [p.id, p])).values());

      return deduped.map((p: any) => {
        const totalTasks = p.tasks.length;
        const completedTasks = p.tasks.filter((t: any) => t.status === "DONE").length;
        const overdueTasks = p.tasks.filter((t: any) => t.due_date && new Date(t.due_date) < new Date() && t.status !== "DONE").length;

        return {
          ...mapProject(p),
          stats: { totalTasks, completedTasks, overdueTasks },
        };
      });
    },
    get: async (id: string): Promise<Project> => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("projects")
        .select(
          `
            *,
            tasks:tasks(id, status, due_date)
        `,
        )
        .eq("id", id)
        .single();

      if (error) throw error;

      // Verify user has access to this project
      const isOwner = data.owner_id === user.id;
      const { data: memberData } = await supabase.from("project_members").select("user_id").eq("project_id", id).eq("user_id", user.id);

      if (!isOwner && (!memberData || memberData.length === 0)) {
        throw new Error("Access denied to this project");
      }

      const totalTasks = data.tasks.length;
      const completedTasks = data.tasks.filter((t: any) => t.status === "DONE").length;
      const overdueTasks = data.tasks.filter((t: any) => t.due_date && new Date(t.due_date) < new Date() && t.status !== "DONE").length;

      return {
        ...mapProject(data),
        stats: { totalTasks, completedTasks, overdueTasks },
      };
    },
    members: async (id: string): Promise<User[]> => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("Not authenticated");

      // Verify user has access to this project
      const { data: project } = await supabase.from("projects").select("owner_id").eq("id", id).single();
      if (!project) throw new Error("Project not found");

      const isOwner = project.owner_id === user.id;
      const { data: memberCheck } = await supabase.from("project_members").select("user_id").eq("project_id", id).eq("user_id", user.id);

      if (!isOwner && (!memberCheck || memberCheck.length === 0)) {
        throw new Error("Access denied to view project members");
      }

      // Get profiles linked via project_members + the owner
      const { data: memberData, error } = await supabase
        .from("project_members")
        .select(
          `
          user:profiles(id, email, full_name, role, avatar_url, created_at)
        `,
        )
        .eq("project_id", id);

      if (error) throw error;

      let ownerData: any = null;
      if (project) {
        const { data: owner } = await supabase.from("profiles").select("*").eq("id", project.owner_id).single();
        ownerData = owner;
      }

      const members = memberData.map((m: any) => ({
        id: m.user.id,
        name: m.user.full_name,
        email: m.user.email,
        role: m.user.role as UserRole,
        avatarUrl: m.user.avatar_url,
        createdAt: m.user.created_at,
      }));

      // Dedup owner if in members list
      if (ownerData && !members.find((m) => m.id === ownerData.id)) {
        members.unshift({
          id: ownerData.id,
          name: ownerData.full_name,
          email: ownerData.email,
          role: ownerData.role as UserRole,
          avatarUrl: ownerData.avatar_url,
          createdAt: ownerData.created_at,
        });
      }

      return members;
    },
    create: async (data: CreateProjectDto) => {
      const user = await requireOwner();

      const { data: project, error } = await supabase
        .from("projects")
        .insert({
          name: data.name,
          description: data.description,
          owner_id: user.id,
          project_goal: data.projectGoal,
          team_size: data.teamSize,
          deadline: data.deadline,
          generated_by_ai: data.projectGoal ? true : undefined,
          project_context: data.projectContext,
        })
        .select()
        .single();

      if (error) throw error;
      return mapProject(project);
    },
    update: async (id: string, data: any) => {
      await requireOwner();
      const updates: any = {};
      if (data.name) updates.name = data.name;
      if (data.description) updates.description = data.description;
      if (data.status) updates.status = data.status;

      const { data: project, error } = await supabase.from("projects").update(updates).eq("id", id).select().single();

      if (error) throw error;
      return mapProject(project);
    },
    remove: async (id: string) => {
      await requireOwner();
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) throw error;
    },
  },
  tasks: {
    list: async (projectId: string, filters: any = {}): Promise<Task[]> => {
      let query = supabase
        .from("tasks")
        .select(
          `
            *,
            assignee:profiles(id, full_name, email, role, avatar_url, created_at)
        `,
        )
        .eq("project_id", projectId);

      if (filters.q) {
        query = query.ilike("title", `%${filters.q}%`);
      }
      if (filters.status) {
        query = query.eq("status", filters.status);
      }
      if (filters.parentTaskId === null) {
        query = query.is("parent_task_id", null);
      } else if (filters.parentTaskId) {
        query = query.eq("parent_task_id", filters.parentTaskId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data.map(mapTask);
    },
    get: async (id: string) => {
      const { data, error } = await supabase.from("tasks").select("*").eq("id", id).single();
      if (error) throw error;
      return mapTask(data);
    },
    create: async (data: any) => {
      const { data: task, error } = await supabase
        .from("tasks")
        .insert({
          project_id: data.projectId,
          milestone_id: data.milestoneId,
          title: data.title,
          description: data.description,
          status: data.status || "BACKLOG",
          priority: data.priority || "MEDIUM",
          assignee_id: data.assigneeId,
          due_date: data.dueDate,
          attachment_url: data.attachmentUrl,
          parent_task_id: data.parentTaskId,
        })
        .select(
          `
             *,
            assignee:profiles(id, full_name, email, role, avatar_url, created_at)
        `,
        )
        .single();

      // Log activity
      await supabase.from("activities").insert({
        project_id: data.projectId,
        user_id: (await supabase.auth.getUser()).data.user!.id,
        action_type: "TASK_CREATED",
        entity_type: "TASK",
        entity_id: task.id,
        metadata: { title: task.title },
      });

      if (error) throw error;
      return mapTask(task);
    },
    update: async (taskId: string, data: any) => {
      const updates: any = {};
      if (data.title) updates.title = data.title;
      if (data.description) updates.description = data.description;
      if (data.status) updates.status = data.status;
      if (data.assigneeId) updates.assignee_id = data.assigneeId;
      if (data.milestoneId !== undefined) updates.milestone_id = data.milestoneId;
      if (data.attachmentUrl !== undefined) updates.attachment_url = data.attachmentUrl;
      if (data.parentTaskId !== undefined) updates.parent_task_id = data.parentTaskId;

      const { data: task, error } = await supabase
        .from("tasks")
        .update(updates)
        .eq("id", taskId)
        .select(
          `
                *,
                assignee:profiles(id, full_name, email, role, avatar_url, created_at)
            `,
        )
        .single();

      if (error) throw error;

      // Log Update Activity
      const currentUserId = (await supabase.auth.getUser()).data.user?.id;
      if (currentUserId) {
        const changes = Object.keys(data).join(", ");
        await supabase.from("activities").insert({
          project_id: task.project_id,
          user_id: currentUserId,
          action_type: "TASK_UPDATED",
          entity_type: "TASK",
          entity_id: task.id,
          metadata: {
            title: task.title,
            changes: changes,
            newData: data,
          },
        });
      }

      return mapTask(task);
    },
    delete: async (taskId: string) => {
      // Log Delete Activity
      const currentUserId = (await supabase.auth.getUser()).data.user?.id;
      // Need project_id for activity log? Yes. But we are deleting the task.
      // We might need to fetch it first if we want to log it correctly linked to project.
      // Or we just delete it.

      // Let's fetch it first to get project_id and title for metadata
      let taskData;
      try {
        const { data } = await supabase.from("tasks").select("project_id, title").eq("id", taskId).single();
        taskData = data;
      } catch (e) {
        /* ignore if not found */
      }

      const { error } = await supabase.from("tasks").delete().eq("id", taskId);
      if (error) throw error;

      if (currentUserId && taskData) {
        await supabase.from("activities").insert({
          project_id: taskData.project_id,
          user_id: currentUserId,
          action_type: "TASK_DELETED",
          entity_type: "TASK",
          entity_id: taskId,
          metadata: { title: taskData.title },
        });
      }
    },
    uploadAttachment: async (file: File) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from("task_attachments").upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("task_attachments").getPublicUrl(fileName);

      return publicUrl;
    },
    comments: async (taskId: string): Promise<Comment[]> => {
      const { data, error } = await supabase
        .from("comments")
        .select(
          `
                *,
                user:profiles(id, full_name, email, role, avatar_url, created_at)
            `,
        )
        .eq("task_id", taskId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data.map(mapComment);
    },
    addComment: async (taskId: string, content: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("comments")
        .insert({
          task_id: taskId,
          user_id: user.id,
          content,
        })
        .select(
          `
                *,
                user:profiles(id, full_name, email, role, avatar_url, created_at)
            `,
        )
        .single();

      if (error) throw error;
      return mapComment(data);
    },
  },
  milestones: {
    list: async (projectId: string): Promise<Milestone[]> => {
      const { data, error } = await supabase
        .from("milestones")
        .select(
          `
            *,
            tasks:tasks(id, status)
        `,
        )
        .eq("project_id", projectId)
        .order("due_date", { ascending: true });

      if (error) throw error;

      return data.map((m: any) => {
        const totalTasks = m.tasks.length;
        const completedTasks = m.tasks.filter((t: any) => t.status === "DONE").length;
        const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        return {
          id: m.id,
          projectId: m.project_id,
          title: m.title,
          description: m.description,
          dueDate: m.due_date,
          status: m.status,
          createdAt: m.created_at,
          updatedAt: m.updated_at,
          progress: progress,
        };
      });
    },
    create: async (data: CreateMilestoneDto) => {
      const { data: milestone, error } = await supabase
        .from("milestones")
        .insert({
          project_id: data.projectId,
          title: data.title,
          description: data.description,
          due_date: data.dueDate,
          status: "OPEN",
        })
        .select()
        .single();

      if (error) throw error;
      return milestone; // No map needed as it's simple usually, but ideally we map
    },
    update: async (id: string, data: UpdateMilestoneDto) => {
      const updates: any = {};
      if (data.title) updates.title = data.title;
      if (data.description) updates.description = data.description;
      if (data.dueDate) updates.due_date = data.dueDate;
      if (data.status) updates.status = data.status;

      const { data: milestone, error } = await supabase.from("milestones").update(updates).eq("id", id).select().single();

      if (error) throw error;
      return milestone;
    },
    delete: async (id: string) => {
      const { error } = await supabase.from("milestones").delete().eq("id", id);
      if (error) throw error;
    },
  },
  activity: {
    list: async (projectId: string): Promise<Activity[]> => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("Not authenticated");

      // Verify user has access to this project
      const { data: project } = await supabase.from("projects").select("owner_id").eq("id", projectId).single();
      if (!project) throw new Error("Project not found");

      const isOwner = project.owner_id === user.id;
      const { data: memberCheck } = await supabase.from("project_members").select("user_id").eq("project_id", projectId).eq("user_id", user.id);

      if (!isOwner && (!memberCheck || memberCheck.length === 0)) {
        throw new Error("Access denied to view project activities");
      }

      const { data, error } = await supabase
        .from("activities")
        .select(
          `
            *,
            user:profiles(id, full_name, email, avatar_url)
        `,
        )
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      return data.map((a: any) => ({
        id: a.id,
        projectId: a.project_id,
        userId: a.user_id,
        user: a.user
          ? {
              id: a.user.id,
              name: a.user.full_name,
              email: a.user.email,
              avatarUrl: a.user.avatar_url,
            }
          : undefined, // Add user object
        action: a.action_type,
        targetType: a.entity_type,
        targetId: a.entity_id,
        metadata: a.metadata,
        createdAt: a.created_at,
      }));
    },
    get: async (id: string): Promise<Activity> => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("activities")
        .select(
          `
                *,
                user:profiles(id, full_name, email, avatar_url)
            `,
        )
        .eq("id", id)
        .single();

      if (error) throw error;

      // Verify user has access to this activity's project
      const { data: project } = await supabase.from("projects").select("owner_id").eq("id", data.project_id).single();
      if (!project) throw new Error("Project not found");

      const isOwner = project.owner_id === user.id;
      const { data: memberCheck } = await supabase.from("project_members").select("user_id").eq("project_id", data.project_id).eq("user_id", user.id);

      if (!isOwner && (!memberCheck || memberCheck.length === 0)) {
        throw new Error("Access denied to view this activity");
      }

      return {
        id: data.id,
        projectId: data.project_id,
        userId: data.user_id,
        user: data.user
          ? {
              id: data.user.id,
              name: data.user.full_name,
              email: data.user.email,
              avatarUrl: data.user.avatar_url,
            }
          : undefined,
        action: data.action_type,
        targetType: data.entity_type,
        targetId: data.entity_id,
        metadata: data.metadata,
        createdAt: data.created_at,
      };
    },
  },
  meetings: {
    list: async (projectId?: string): Promise<Meeting[]> => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("Not authenticated");

      // Get user's role
      const { data: profile, error: profileError } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      if (profileError) throw profileError;
      const userRole = (profile?.role as UserRole) || UserRole.MEMBER;

      // If admin or owner, get all meetings!
      if (userRole === UserRole.ADMIN || userRole === UserRole.OWNER) {
        let query = supabase.from("meetings").select("*").order("meeting_date", { ascending: false });
        if (projectId) {
          query = query.eq("project_id", projectId);
        }
        const { data, error } = await query;
        if (error) throw error;
        return data.map((m: any) => ({
          id: m.id,
          projectId: m.project_id,
          title: m.title,
          meetingDate: m.meeting_date,
          meetingLink: m.meeting_link,
          retrospective: m.retrospective,
          meetingNotes: m.meeting_notes,
          meetingSummary: m.meeting_summary,
          createdBy: m.created_by,
          createdAt: m.created_at,
          updatedAt: m.updated_at,
        }));
      }

      // Get project IDs user has access to (owned or member)
      const { data: memberData } = await supabase.from("project_members").select("project_id").eq("user_id", user.id);

      const { data: ownedProjects } = await supabase.from("projects").select("id").eq("owner_id", user.id);

      const accessibleProjectIds = [...ownedProjects.map((p: any) => p.id), ...(memberData?.map((m: any) => m.project_id) || [])];

      let query = supabase.from("meetings").select("*").order("meeting_date", { ascending: false });

      if (projectId) {
        query = query.eq("project_id", projectId);
      } else if (accessibleProjectIds.length > 0) {
        query = query.in("project_id", accessibleProjectIds);
      } else {
        return []; // User has no accessible projects
      }

      const { data, error } = await query;
      if (error) throw error;

      return data.map((m: any) => ({
        id: m.id,
        projectId: m.project_id,
        title: m.title,
        meetingDate: m.meeting_date,
        meetingLink: m.meeting_link,
        retrospective: m.retrospective,
        meetingNotes: m.meeting_notes,
        meetingSummary: m.meeting_summary,
        createdBy: m.created_by,
        createdAt: m.created_at,
        updatedAt: m.updated_at,
      }));
    },
    get: async (id: string): Promise<Meeting> => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("Not authenticated");

      const { data, error } = await supabase.from("meetings").select("*").eq("id", id).single();
      if (error) throw error;

      // Verify user has access to this meeting's project
      const { data: project } = await supabase.from("projects").select("owner_id").eq("id", data.project_id).single();
      if (!project) throw new Error("Project not found");

      const isOwner = project.owner_id === user.id;
      const { data: memberCheck } = await supabase.from("project_members").select("user_id").eq("project_id", data.project_id).eq("user_id", user.id);

      if (!isOwner && (!memberCheck || memberCheck.length === 0)) {
        throw new Error("Access denied to view this meeting");
      }

      return {
        id: data.id,
        projectId: data.project_id,
        title: data.title,
        meetingDate: data.meeting_date,
        meetingLink: data.meeting_link,
        retrospective: data.retrospective,
        meetingNotes: data.meeting_notes,
        meetingSummary: data.meeting_summary,
        createdBy: data.created_by,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    },
    create: async (data: CreateMeetingDto): Promise<Meeting> => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) throw new Error("Not authenticated");
      const userId = userData.user.id;

      // Verify user has access to this project (owner or member)
      const { data: project } = await supabase.from("projects").select("owner_id").eq("id", data.projectId).single();
      if (!project) throw new Error("Project not found");

      const isOwner = project.owner_id === userId;
      const { data: memberCheck } = await supabase.from("project_members").select("user_id").eq("project_id", data.projectId).eq("user_id", userId);

      if (!isOwner && (!memberCheck || memberCheck.length === 0)) {
        throw new Error("Access denied - you are not a member of this project");
      }

      const { data: meeting, error } = await supabase
        .from("meetings")
        .insert({
          project_id: data.projectId,
          title: data.title,
          meeting_date: data.meetingDate,
          meeting_link: data.meetingLink,
          retrospective: data.retrospective,
          created_by: userId,
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: meeting.id,
        projectId: meeting.project_id,
        title: meeting.title,
        meetingDate: meeting.meeting_date,
        meetingLink: meeting.meeting_link,
        retrospective: meeting.retrospective,
        meetingNotes: meeting.meeting_notes,
        meetingSummary: meeting.meeting_summary,
        createdBy: meeting.created_by,
        createdAt: meeting.created_at,
        updatedAt: meeting.updated_at,
      };
    },
    update: async (id: string, data: UpdateMeetingDto): Promise<Meeting> => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("Not authenticated");

      // Get meeting to find project
      const { data: meeting, error: meetingError } = await supabase.from("meetings").select("project_id").eq("id", id).single();
      if (meetingError) throw meetingError;

      // Verify user has access to this meeting's project (only owner can update)
      const { data: project } = await supabase.from("projects").select("owner_id").eq("id", meeting.project_id).single();
      if (!project) throw new Error("Project not found");

      if (project.owner_id !== user.id) {
        throw new Error("Access denied - only project owner can update meetings");
      }

      const updates: any = {};
      if (data.title) updates.title = data.title;
      if (data.meetingDate) updates.meeting_date = data.meetingDate;
      if (data.meetingLink !== undefined) updates.meeting_link = data.meetingLink;
      if (data.retrospective !== undefined) updates.retrospective = data.retrospective;
      if (data.meetingNotes !== undefined) updates.meeting_notes = data.meetingNotes;
      if (data.meetingSummary !== undefined) updates.meeting_summary = data.meetingSummary;
      updates.updated_at = new Date().toISOString();

      const { data: updatedMeeting, error } = await supabase.from("meetings").update(updates).eq("id", id).select().single();
      if (error) throw error;

      return {
        id: updatedMeeting.id,
        projectId: updatedMeeting.project_id,
        title: updatedMeeting.title,
        meetingDate: updatedMeeting.meeting_date,
        meetingLink: updatedMeeting.meeting_link,
        retrospective: updatedMeeting.retrospective,
        meetingNotes: updatedMeeting.meeting_notes,
        meetingSummary: updatedMeeting.meeting_summary,
        createdBy: updatedMeeting.created_by,
        createdAt: updatedMeeting.created_at,
        updatedAt: updatedMeeting.updated_at,
      };
    },
    delete: async (id: string) => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("Not authenticated");

      // Get meeting to find project
      const { data: meeting } = await supabase.from("meetings").select("project_id").eq("id", id).single();
      if (!meeting) throw new Error("Meeting not found");

      // Verify user is the project owner
      const { data: project } = await supabase.from("projects").select("owner_id").eq("id", meeting.project_id).single();
      if (!project) throw new Error("Project not found");

      if (project.owner_id !== user.id) {
        throw new Error("Access denied - only project owner can delete meetings");
      }

      const { error } = await supabase.from("meetings").delete().eq("id", id);
      if (error) throw error;
    },
    sendEmail: async (data: { to: string[]; subject: string; html: string }) => {
      const { data: response, error } = await supabase.functions.invoke("send-meeting-email", {
        body: data,
      });
      if (error) throw error;
      return response;
    },
  },
  insights: {
    getLatest: async (projectId: string): Promise<ProjectInsight | null> => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("Not authenticated");

      // Verify user has access to this project
      const { data: project } = await supabase.from("projects").select("owner_id").eq("id", projectId).single();
      if (!project) throw new Error("Project not found");

      const isOwner = project.owner_id === user.id;
      const { data: memberCheck } = await supabase.from("project_members").select("user_id").eq("project_id", projectId).eq("user_id", user.id);

      if (!isOwner && (!memberCheck || memberCheck.length === 0)) {
        throw new Error("Access denied to view project insights");
      }

      const { data, error } = await supabase.from("ai_project_insights").select("*").eq("project_id", projectId).order("created_at", { ascending: false }).limit(1).single();
      if (error && error.code !== "PGRST116") throw error;
      if (!data) return null;
      return {
        id: data.id,
        projectId: data.project_id,
        healthScore: data.health_score,
        riskLevel: data.risk_level,
        recommendations: data.recommendations,
        delayPrediction: data.delay_prediction,
        bottlenecks: data.bottlenecks,
        createdAt: data.created_at,
      };
    },
    save: async (projectId: string, insightData: Omit<ProjectInsight, "id" | "projectId" | "createdAt">): Promise<ProjectInsight> => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("Not authenticated");

      // Verify user has access to this project (owner only for saving)
      const { data: project } = await supabase.from("projects").select("owner_id").eq("id", projectId).single();
      if (!project) throw new Error("Project not found");

      if (project.owner_id !== user.id) {
        throw new Error("Access denied - only project owner can save insights");
      }

      const { data, error } = await supabase
        .from("ai_project_insights")
        .insert({
          project_id: projectId,
          health_score: insightData.healthScore,
          risk_level: insightData.riskLevel,
          recommendations: insightData.recommendations,
          delay_prediction: insightData.delayPrediction,
          bottlenecks: insightData.bottlenecks,
        })
        .select()
        .single();
      if (error) throw error;
      return {
        id: data.id,
        projectId: data.project_id,
        healthScore: data.health_score,
        riskLevel: data.risk_level,
        recommendations: data.recommendations,
        delayPrediction: data.delay_prediction,
        bottlenecks: data.bottlenecks,
        createdAt: data.created_at,
      };
    },
  },
  search: {
    global: async (query: string): Promise<{ projects: Project[]; tasks: Task[] }> => {
      if (!query || query.length < 2) return { projects: [], tasks: [] };

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("Not authenticated");

      // Get accessible project IDs
      const { data: memberData } = await supabase.from("project_members").select("project_id").eq("user_id", user.id);

      const { data: ownedProjects } = await supabase.from("projects").select("id").eq("owner_id", user.id);

      const accessibleProjectIds = [...ownedProjects.map((p: any) => p.id), ...(memberData?.map((m: any) => m.project_id) || [])];

      let projects: any[] = [];
      if (accessibleProjectIds.length > 0) {
        const { data: projectResults, error: projectsError } = await supabase.from("projects").select("*").in("id", accessibleProjectIds).ilike("name", `%${query}%`).limit(5);
        if (projectsError) throw projectsError;
        projects = projectResults;
      }

      let tasks: any[] = [];
      if (accessibleProjectIds.length > 0) {
        const { data: taskResults, error: tasksError } = await supabase.from("tasks").select("*").in("project_id", accessibleProjectIds).ilike("title", `%${query}%`).limit(5);
        if (tasksError) throw tasksError;
        tasks = taskResults;
      }

      return {
        projects: projects.map(mapProject),
        tasks: tasks.map(mapTask),
      };
    },
  },
  admin: {
    getAllUsers: async (): Promise<User[]> => {
      await requireAdminOrOwner();
      const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data.map((p: any) => ({
        id: p.id,
        name: p.full_name,
        email: p.email,
        role: p.role as UserRole,
        avatarUrl: p.avatar_url,
        createdAt: p.created_at,
      }));
    },
    getAllProjects: async (): Promise<Project[]> => {
      await requireAdminOrOwner();
      const { data, error } = await supabase
        .from("projects")
        .select(
          `
            *,
            tasks:tasks(id, status, due_date)
        `,
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data.map((p: any) => {
        const totalTasks = p.tasks?.length || 0;
        const completedTasks = p.tasks?.filter((t: any) => t.status === "DONE").length || 0;
        const overdueTasks = p.tasks?.filter((t: any) => t.due_date && new Date(t.due_date) < new Date() && t.status !== "DONE").length || 0;

        return {
          ...mapProject(p),
          stats: { totalTasks, completedTasks, overdueTasks },
        };
      });
    },
    getAllMeetings: async (): Promise<Meeting[]> => {
      await requireAdminOrOwner();
      const { data, error } = await supabase.from("meetings").select("*").order("meeting_date", { ascending: false });
      if (error) throw error;
      return data.map((m: any) => ({
        id: m.id,
        projectId: m.project_id,
        title: m.title,
        meetingDate: m.meeting_date,
        meetingLink: m.meeting_link,
        retrospective: m.retrospective,
        meetingNotes: m.meeting_notes,
        meetingSummary: m.meeting_summary,
        createdBy: m.created_by,
        createdAt: m.created_at,
        updatedAt: m.updated_at,
      }));
    },
    updateUserRole: async (userId: string, newRole: UserRole) => {
      await requireAdminOrOwner();
      const { error } = await supabase.from("profiles").update({ role: newRole }).eq("id", userId);
      if (error) throw error;
    },
    deleteProject: async (projectId: string) => {
      await requireAdminOrOwner();
      const { error } = await supabase.from("projects").delete().eq("id", projectId);
      if (error) throw error;
    },
    deleteMeeting: async (meetingId: string) => {
      await requireAdminOrOwner();
      const { error } = await supabase.from("meetings").delete().eq("id", meetingId);
      if (error) throw error;
    },
    deleteUser: async (userId: string) => {
      await requireAdminOrOwner();
      // Delete the profile first
      const { error: profileError } = await supabase.from("profiles").delete().eq("id", userId);
      if (profileError) throw profileError;
      // Note: To fully delete the auth user, you need a server-side function (Supabase Edge Function)
      // because client-side SDK can't delete auth users directly
    },
  },
};
