# Implementation Plan - Project Milestones

## Goal
Add "Milestones" to projects to group tasks into phases (e.g., "Sprint 1", "MVP Release"). This allows users to track progress at a higher level than individual tasks.

## Proposed Changes

### Database Schema (Supabase)
#### [NEW] `milestones` table
- `id`: uuid (PK)
- `project_id`: uuid (FK -> projects)
- `title`: text
- `description`: text
- `due_date`: timestamptz
- `status`: enum ('OPEN', 'CLOSED')

#### [MODIFY] `tasks` table
- Add `milestone_id`: uuid (FK -> milestones, nullable)

### Backend / Types (`types.ts` & `apiClient.ts`)
- Add `Milestone` interface.
- Add `createMilestone`, `getProjectMilestones`, `deleteMilestone` API methods.
- Update `CreateTaskDto` and `UpdateTaskDto` to include `milestoneId`.

### Frontend Components
#### [NEW] `MilestoneList.tsx`
- A new tab in `ProjectDetailPage` showing list of milestones.
- Displays a **Progress Bar** for each milestone (Calculated from % of completed tasks assigned to it).

#### [MODIFY] `TaskDetailModal.tsx` / `NewTaskModal.tsx`
- Add a dropdown to select a Milestone when creating/editing a task.

#### [MODIFY] `ProjectDetailPage.tsx`
- Add "Milestones" tab.
- Potentially filter task list by Milestone.

## Verification
1.  **Schema**: Verify table creation and foreign keys in Supabase.
2.  **API**: Test creating a milestone and assigning a task to it.
3.  **UI**:
    - Create a Milestone "Sprint 1".
    - Create 2 tasks, assign to "Sprint 1".
    - Complete 1 task -> Verify "Sprint 1" progress bar shows 50%.
