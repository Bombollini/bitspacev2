
export enum UserRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
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
  // AI Project Generator fields
  projectGoal?: string; // Mapped from project_goal
  teamSize?: number; // Mapped from team_size
  deadline?: string; // Due date for the project
  generatedByAI?: boolean; // Mapped from generated_by_ai
  projectContext?: string; // Additional context for AI
}

export interface CreateProjectDto {
  name: string;
  description?: string;
  projectGoal?: string;
  teamSize?: number;
  deadline?: string;
  projectContext?: string;
}

export interface AIProjectGeneratorRequest {
  prompt: string; // User's project description/goal
  teamSize: number;
  deadline: string; // ISO date
}

export interface AIGeneratedProject {
  name: string;
  description: string;
  projectGoal: string;
  teamSize: number;
  deadline: string;
  milestones: AIGeneratedMilestone[];
  tasks: AIGeneratedTask[];
}

export interface AIGeneratedMilestone {
  title: string;
  description?: string;
  dueDate?: string; // Relative to project deadline
  order: number;
}

export interface AIGeneratedTask {
  title: string;
  description?: string;
  priority: TaskPriority;
  estimatedDays?: number;
  milestoneIndex?: number; // Reference to milestone
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
  attachmentUrl?: string; // Mapped from attachment_url
  createdAt: string; // Mapped from created_at
  updatedAt: string; // Mapped from updated_at
  parentTaskId?: string | null; // Mapped from parent_task_id
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
  attachmentUrl?: string;
  parentTaskId?: string;
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
  attachmentUrl?: string | null;
  parentTaskId?: string | null;
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

export interface Meeting {
  id: string;
  projectId: string; // Mapped from project_id
  title: string;
  meetingDate: string; // Mapped from meeting_date
  meetingLink?: string; // Mapped from meeting_link
  retrospective?: string;
  meetingNotes?: string;
  meetingSummary?: {
    summary: string;
    keyDecisions: string[];
    actionItems: {
      taskTitle: string;
      description: string;
      suggestedAssigneeId?: string;
    }[];
  };
  createdBy?: string; // Mapped from created_by
  createdAt: string; // Mapped from created_at
  updatedAt: string; // Mapped from updated_at
}

export interface CreateMeetingDto {
  projectId: string;
  title: string;
  meetingDate: string;
  meetingLink?: string;
  retrospective?: string;
}

export interface UpdateMeetingDto {
  title?: string;
  meetingDate?: string;
  meetingLink?: string;
  retrospective?: string;
  meetingNotes?: string;
  meetingSummary?: {
    summary: string;
    keyDecisions: string[];
    actionItems: {
      taskTitle: string;
      description: string;
      suggestedAssigneeId?: string;
    }[];
  };
}

export interface ProjectInsight {
  id: string;
  projectId: string; // Mapped from project_id
  healthScore: number; // Mapped from health_score
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'; // Mapped from risk_level
  recommendations: string[];
  delayPrediction?: string; // Mapped from delay_prediction
  bottlenecks: string[];
  createdAt: string; // Mapped from created_at
}

// Time Tracking Types
export interface TimeEntry {
  id: string;
  taskId: string; // Mapped from task_id
  userId: string; // Mapped from user_id
  startTime: string; // Mapped from start_time
  endTime?: string; // Mapped from end_time
  duration?: number; // In minutes, calculated
  description?: string;
  createdAt: string; // Mapped from created_at
  updatedAt: string; // Mapped from updated_at
  user?: User;
}

export interface CreateTimeEntryDto {
  taskId: string;
  startTime: string;
  endTime?: string;
  description?: string;
}

export interface UpdateTimeEntryDto {
  startTime?: string;
  endTime?: string;
  description?: string;
}

// Workload Types
export interface MemberWorkload {
  userId: string;
  user: User;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  totalHours: number; // Estimated total hours
  workloadPercentage: number; // 0-100%
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface WorkloadAlert {
  id: string;
  userId: string;
  projectId: string;
  type: 'OVERLOAD' | 'DEADLINE_APPROACHING' | 'BOTTLENECK';
  message: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  createdAt: string;
  isRead: boolean;
}

// Analytics Types
export interface TaskCompletionStats {
  date: string;
  completed: number;
  total: number;
}

export interface MemberPerformance {
  userId: string;
  user: User;
  tasksCompleted: number;
  averageCompletionTime: number; // In hours
  onTimeDelivery: number; // Percentage
  productivityScore: number; // 0-100
}

export interface ProjectAnalytics {
  taskCompletionRate: number; // Percentage
  averageTaskDuration: number; // In hours
  milestoneCompletion: number; // Percentage
  teamProductivity: number; // 0-100
  weeklyTrends: TaskCompletionStats[];
  memberPerformance: MemberPerformance[];
}

// Gantt Chart Types
export interface GanttTask {
  id: string;
  taskId: string;
  title: string;
  startDate: string;
  endDate: string;
  progress: number; // 0-100
  assignee?: string;
  priority: TaskPriority;
  status: TaskStatus;
  parentId?: string;
  milestoneId?: string;
  color: string;
}

export interface GanttMilestone {
  id: string;
  milestoneId: string;
  title: string;
  date: string;
  status: 'OPEN' | 'CLOSED';
  progress: number;
}
