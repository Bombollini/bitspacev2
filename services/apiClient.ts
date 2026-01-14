
import { supabase } from './supabaseClient';
import { User, Project, Task, Activity, CreateProjectDto, UserRole, ProjectStatus, TaskStatus, TaskPriority, Comment, Milestone, CreateMilestoneDto, UpdateMilestoneDto } from '../types';

// Helper to map DB snake_case to CamelCase
const mapProject = (data: any): Project => ({
  id: data.id,
  name: data.name,
  description: data.description,
  ownerId: data.owner_id,
  status: data.status as ProjectStatus,
  createdAt: data.created_at,
  updatedAt: data.updated_at,
  stats: {
    totalTasks: 0, // Needs aggregation
    completedTasks: 0, // Needs aggregation
    overdueTasks: 0, // Needs aggregation
  }
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
  assignee: data.assignee ? {
    id: data.assignee.id,
    name: data.assignee.full_name,
    email: data.assignee.email,
    role: data.assignee.role,
    avatarUrl: data.assignee.avatar_url,
    createdAt: data.assignee.created_at
  } : undefined,
  dueDate: data.due_date,
  createdAt: data.created_at,
  updatedAt: data.updated_at
});

const mapComment = (data: any): Comment => ({
  id: data.id,
  taskId: data.task_id,
  userId: data.user_id,
  user: data.user ? {
    id: data.user.id,
    name: data.user.full_name,
    email: data.user.email,
    role: data.user.role,
    avatarUrl: data.user.avatar_url,
    createdAt: data.user.created_at
  } : undefined,
  content: data.content,
  createdAt: data.created_at,
  updatedAt: data.updated_at
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
        const { data: { user } } = await supabase.auth.getUser();
        if(!user) return null;
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        return data;
    }
  },
  profiles: {
      search: async (query: string): Promise<User[]> => {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
            .limit(10);
          
          if (error) throw error;
          
          return data.map((p: any) => ({
              id: p.id,
              name: p.full_name,
              email: p.email,
              role: p.role as UserRole,
              avatarUrl: p.avatar_url,
              createdAt: p.created_at
          }));
      },
      uploadAvatar: async (file: File) => {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error('Not authenticated');

          const fileExt = file.name.split('.').pop();
          const fileName = `${user.id}/${Date.now()}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
              .from('avatars')
              .upload(fileName, file, { upsert: true });

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
              .from('avatars')
              .getPublicUrl(fileName);

          // Update profile
          const { error: updateError } = await supabase
              .from('profiles')
              .update({ avatar_url: publicUrl })
              .eq('id', user.id);

          if (updateError) throw updateError;

          return publicUrl;
      }
  },
  projects: {
    addMember: async (projectId: string, userId: string, role: string) => {
        const { error } = await supabase.from('project_members').insert({
            project_id: projectId,
            user_id: userId,
            role: role
        });
        if (error) throw error;

        // Log Add Member Activity
        const currentUserId = (await supabase.auth.getUser()).data.user?.id;
        if (currentUserId) {
            await supabase.from('activities').insert({
                project_id: projectId,
                user_id: currentUserId,
                action_type: 'MEMBER_ADDED',
                entity_type: 'MEMBER',
                entity_id: userId,
                metadata: { role: role }
            });
        }
    },
    removeMember: async (projectId: string, userId: string) => {
        const { error } = await supabase
            .from('project_members')
            .delete()
            .eq('project_id', projectId)
            .eq('user_id', userId);
        if (error) throw error;

        // Log Remove Member Activity
        const currentUserId = (await supabase.auth.getUser()).data.user?.id;
        if (currentUserId) {
            await supabase.from('activities').insert({
                project_id: projectId,
                user_id: currentUserId,
                action_type: 'MEMBER_REMOVED',
                entity_type: 'MEMBER',
                entity_id: userId,
                metadata: {} 
            });
        }
    },
    list: async (): Promise<Project[]> => {
      const { data, error } = await supabase
        .from('projects')
        .select(`
            *,
            tasks:tasks(id, status)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map((p: any) => {
          const totalTasks = p.tasks.length;
          const completedTasks = p.tasks.filter((t: any) => t.status === 'DONE').length;
          const overdueTasks = p.tasks.filter((t: any) => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'DONE').length;

          return {
              ...mapProject(p),
              stats: { totalTasks, completedTasks, overdueTasks }
          };
      });
    },
    get: async (id: string): Promise<Project> => {
      const { data, error } = await supabase
        .from('projects')
        .select(`
            *,
            tasks:tasks(id, status, due_date)
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;

      const totalTasks = data.tasks.length;
      const completedTasks = data.tasks.filter((t: any) => t.status === 'DONE').length;
      const overdueTasks = data.tasks.filter((t: any) => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'DONE').length;

      return {
          ...mapProject(data),
          stats: { totalTasks, completedTasks, overdueTasks }
      };
    },
    members: async (id: string): Promise<User[]> => {
      // Get profiles linked via project_members + the owner
      const { data: memberData, error } = await supabase
        .from('project_members')
        .select(`
          user:profiles(id, email, full_name, role, avatar_url, created_at)
        `)
        .eq('project_id', id);

      if (error) throw error;
      
      // Also get owner
      const { data: project } = await supabase.from('projects').select('owner_id').eq('id', id).single();
      let ownerData: any = null;
      if (project) {
          const { data: owner } = await supabase.from('profiles').select('*').eq('id', project.owner_id).single();
          ownerData = owner;
      }

      const members = memberData.map((m: any) => ({
          id: m.user.id,
          name: m.user.full_name,
          email: m.user.email,
          role: m.user.role as UserRole,
          avatarUrl: m.user.avatar_url,
          createdAt: m.user.created_at
      }));

      // Dedup owner if in members list
      if (ownerData && !members.find(m => m.id === ownerData.id)) {
           members.unshift({
              id: ownerData.id,
               name: ownerData.full_name,
               email: ownerData.email,
               role: ownerData.role as UserRole,
               avatarUrl: ownerData.avatar_url,
               createdAt: ownerData.created_at
           });
      }

      return members;
    },
    create: async (data: CreateProjectDto) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: project, error } = await supabase
        .from('projects')
        .insert({
            name: data.name,
            description: data.description,
            owner_id: user.id
        })
        .select()
        .single();

      if (error) throw error;
      return mapProject(project);
    },
    update: async (id: string, data: any) => {
       const updates: any = {};
       if (data.name) updates.name = data.name;
       if (data.description) updates.description = data.description;
       if (data.status) updates.status = data.status;

       const { data: project, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
        
       if (error) throw error;
       return mapProject(project);
    },
    remove: async (id: string) => {
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (error) throw error;
    }
  },
  tasks: {
    list: async (projectId: string, filters: any = {}): Promise<Task[]> => {
      let query = supabase
        .from('tasks')
        .select(`
            *,
            assignee:profiles(id, full_name, email, role, avatar_url, created_at)
        `)
        .eq('project_id', projectId);
      
      if (filters.q) {
          query = query.ilike('title', `%${filters.q}%`);
      }
      if (filters.status) {
          query = query.eq('status', filters.status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data.map(mapTask);
    },
    get: async (id: string) => {
        const { data, error } = await supabase.from('tasks').select('*').eq('id', id).single();
        if (error) throw error;
        return mapTask(data);
    },
    create: async (data: any) => {
       const { data: task, error } = await supabase
        .from('tasks')
        .insert({
            project_id: data.projectId,
            milestone_id: data.milestoneId,
            title: data.title,
            description: data.description,
            status: data.status || 'BACKLOG',
            priority: data.priority || 'MEDIUM',
            assignee_id: data.assigneeId,
            due_date: data.dueDate
        })
        .select(`
             *,
            assignee:profiles(id, full_name, email, role, avatar_url, created_at)
        `)
        .single();
        
        // Log activity
        await supabase.from('activities').insert({
            project_id: data.projectId,
            user_id: (await supabase.auth.getUser()).data.user!.id,
            action_type: 'TASK_CREATED',
            entity_type: 'TASK',
            entity_id: task.id,
            metadata: { title: task.title }
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

        const { data: task, error } = await supabase
            .from('tasks')
            .update(updates)
            .eq('id', taskId)
            .select(`
                *,
                assignee:profiles(id, full_name, email, role, avatar_url, created_at)
            `)
            .single();

        if (error) throw error;
        
        // Log Update Activity
        const currentUserId = (await supabase.auth.getUser()).data.user?.id;
        if (currentUserId) {
             const changes = Object.keys(data).join(', ');
             await supabase.from('activities').insert({
                project_id: task.project_id,
                user_id: currentUserId,
                action_type: 'TASK_UPDATED',
                entity_type: 'TASK',
                entity_id: task.id,
                metadata: { 
                    title: task.title,
                    changes: changes,
                    newData: data
                }
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
             const { data } = await supabase.from('tasks').select('project_id, title').eq('id', taskId).single();
             taskData = data;
        } catch (e) { /* ignore if not found */ }

        const { error } = await supabase.from('tasks').delete().eq('id', taskId);
        if (error) throw error;

        if (currentUserId && taskData) {
            await supabase.from('activities').insert({
                project_id: taskData.project_id,
                user_id: currentUserId,
                action_type: 'TASK_DELETED',
                entity_type: 'TASK',
                entity_id: taskId,
                metadata: { title: taskData.title }
            });
        }
    },
    comments: async (taskId: string): Promise<Comment[]> => {
        const { data, error } = await supabase
            .from('comments')
            .select(`
                *,
                user:profiles(id, full_name, email, role, avatar_url, created_at)
            `)
            .eq('task_id', taskId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data.map(mapComment);
    },
    addComment: async (taskId: string, content: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data, error } = await supabase
            .from('comments')
            .insert({
                task_id: taskId,
                user_id: user.id,
                content
            })
            .select(`
                *,
                user:profiles(id, full_name, email, role, avatar_url, created_at)
            `)
            .single();

        if (error) throw error;
        return mapComment(data);
    }
  },
  milestones: {
    list: async (projectId: string): Promise<Milestone[]> => {
      const { data, error } = await supabase
        .from('milestones')
        .select(`
            *,
            tasks:tasks(id, status)
        `)
        .eq('project_id', projectId)
        .order('due_date', { ascending: true });

      if (error) throw error;

      return data.map((m: any) => {
        const totalTasks = m.tasks.length;
        const completedTasks = m.tasks.filter((t: any) => t.status === 'DONE').length;
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
          progress: progress
        };
      });
    },
    create: async (data: CreateMilestoneDto) => {
      const { data: milestone, error } = await supabase
        .from('milestones')
        .insert({
          project_id: data.projectId,
          title: data.title,
          description: data.description,
          due_date: data.dueDate,
          status: 'OPEN'
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

        const { data: milestone, error } = await supabase
            .from('milestones')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return milestone;
    },
    delete: async (id: string) => {
        const { error } = await supabase.from('milestones').delete().eq('id', id);
        if (error) throw error;
    }
  },
  activity: {
    list: async (projectId: string): Promise<Activity[]> => {
      const { data, error } = await supabase
        .from('activities')
        .select(`
            *,
            user:profiles(id, full_name, email, avatar_url)
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      return data.map((a: any) => ({
          id: a.id,
          projectId: a.project_id,
          userId: a.user_id,
          user: a.user ? {
              id: a.user.id,
              name: a.user.full_name,
              email: a.user.email,
              avatarUrl: a.user.avatar_url,
          } : undefined, // Add user object
          action: a.action_type,
          targetType: a.entity_type,
          targetId: a.entity_id,
          metadata: a.metadata,
          createdAt: a.created_at
      }));
    },
    get: async (id: string): Promise<Activity> => {
        const { data, error } = await supabase
            .from('activities')
            .select(`
                *,
                user:profiles(id, full_name, email, avatar_url)
            `)
            .eq('id', id)
            .single();

        if (error) throw error;
        
        return {
            id: data.id,
            projectId: data.project_id,
            userId: data.user_id,
            user: data.user ? {
                id: data.user.id,
                name: data.user.full_name,
                email: data.user.email,
                avatarUrl: data.user.avatar_url,
            } : undefined,
            action: data.action_type,
            targetType: data.entity_type,
            targetId: data.entity_id,
            metadata: data.metadata,
            createdAt: data.created_at
        };
    }
  },
  search: {
    global: async (query: string): Promise<{ projects: Project[], tasks: Task[] }> => {
        if (!query || query.length < 2) return { projects: [], tasks: [] };

        const { data: projects, error: projectsError } = await supabase
            .from('projects')
            .select('*')
            .ilike('name', `%${query}%`)
            .limit(5);
        
        if (projectsError) throw projectsError;

        const { data: tasks, error: tasksError } = await supabase
            .from('tasks')
            .select('*')
            .ilike('title', `%${query}%`)
            .limit(5);

        if (tasksError) throw tasksError;

        return {
            projects: projects.map(mapProject),
            tasks: tasks.map(mapTask)
        };
    }
  }
};
