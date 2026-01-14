
export enum UserRole {
  OWNER = 'OWNER',
  MEMBER = 'MEMBER',
}

export enum ProjectStatus {
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
}

export enum TaskStatus {
  BACKLOG = 'BACKLOG',
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  REVIEW = 'REVIEW',
  DONE = 'DONE',
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string; // Mapped from avatar_url
  role: UserRole;
  createdAt: string; // Mapped from created_at
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
}

export interface ProjectStats {
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  ownerId: string; // Mapped from owner_id
  status: ProjectStatus;
  createdAt: string; // Mapped from created_at
  updatedAt: string; // Mapped from updated_at
  stats?: ProjectStats; // Derived field
}

export interface CreateProjectDto {
  name: string;
  description?: string;
}

export interface UpdateProjectDto {
  name?: string;
  description?: string;
  status?: ProjectStatus;
  ownerId?: string;
}

export interface Task {
  id: string;
  projectId: string; // Mapped from project_id
  milestoneId?: string | null; // Mapped from milestone_id
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: string; // Mapped from assignee_id
  assignee?: User; // Joined field
  dueDate?: string; // Mapped from due_date
  createdAt: string; // Mapped from created_at
  updatedAt: string; // Mapped from updated_at
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  dueDate?: string;
  projectId: string;
  milestoneId?: string;
}


export interface Milestone {
  id: string;
  projectId: string; // Mapped from project_id
  title: string;
  description?: string;
  dueDate?: string; // Mapped from due_date
  status: 'OPEN' | 'CLOSED';
  createdAt: string; // Mapped from created_at
  updatedAt: string; // Mapped from updated_at
  progress?: number; // Helpers
}

export interface CreateMilestoneDto {
  projectId: string;
  title: string;
  description?: string;
  dueDate?: string;
}

export interface UpdateMilestoneDto {
  title?: string;
  description?: string;
  dueDate?: string;
  status?: 'OPEN' | 'CLOSED';
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  dueDate?: string;
  milestoneId?: string | null;
}


export interface Member {
  userId: string;
  projectId: string;
  role: string;
  joinedAt: string;
}

export interface Activity {
  id: string;
  projectId: string; // Mapped from project_id
  userId: string; // Mapped from user_id
  action: string; // Mapped from action_type
  targetType: string; // Mapped from entity_type
  targetId: string; // Mapped from entity_id
  metadata?: any;
  createdAt: string; // Mapped from creating_at
  user?: {
      id: string;
      name: string;
      avatarUrl?: string; // Mapped from avatar_url
      email: string;
  };
}

export interface Comment {
  id: string;
  taskId: string;
  userId: string;
  user?: User;
  content: string;
  createdAt: string;
  updatedAt: string;
}
