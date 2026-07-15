# Class Diagram Bitspace

```mermaid
classDiagram
    %% Enums
    class UserRole {
        <<enumeration>>
        OWNER
        ADMIN
        MEMBER
    }

    class ProjectStatus {
        <<enumeration>>
        ACTIVE
        ARCHIVED
    }

    class TaskStatus {
        <<enumeration>>
        BACKLOG
        TODO
        IN_PROGRESS
        REVIEW
        DONE
    }

    class TaskPriority {
        <<enumeration>>
        LOW
        MEDIUM
        HIGH
    }

    %% Entities
    class User {
        +String id
        +String email
        +String name
        +String? avatarUrl
        +UserRole role
        +String createdAt
    }

    class Project {
        +String id
        +String name
        +String? description
        +String ownerId
        +ProjectStatus status
        +String createdAt
        +String updatedAt
        +ProjectStats? stats
        +String? projectGoal
        +Number? teamSize
        +String? deadline
        +Boolean? generatedByAI
        +String? projectContext
    }

    class ProjectStats {
        +Number totalTasks
        +Number completedTasks
        +Number overdueTasks
    }

    class Task {
        +String id
        +String projectId
        +String? milestoneId
        +String title
        +String? description
        +TaskStatus status
        +TaskPriority priority
        +String? assigneeId
        +User? assignee
        +String? dueDate
        +String? attachmentUrl
        +String createdAt
        +String updatedAt
        +String? parentTaskId
    }

    class Milestone {
        +String id
        +String projectId
        +String title
        +String? description
        +String? dueDate
        +String status (OPEN/CLOSED)
        +String createdAt
        +String updatedAt
        +Number? progress
    }

    class Member {
        +String userId
        +String projectId
        +String role
        +String joinedAt
    }

    class Meeting {
        +String id
        +String projectId
        +String title
        +String meetingDate
        +String? meetingLink
        +String? retrospective
        +String? meetingNotes
        +MeetingSummary? meetingSummary
        +String? createdBy
        +String createdAt
        +String updatedAt
    }

    class MeetingSummary {
        +String summary
        +String[] keyDecisions
        +ActionItem[] actionItems
    }

    class ActionItem {
        +String taskTitle
        +String description
        +String? suggestedAssigneeId
    }

    class Activity {
        +String id
        +String projectId
        +String userId
        +String action
        +String targetType
        +String targetId
        +Object? metadata
        +String createdAt
        +Object? user
    }

    class Comment {
        +String id
        +String taskId
        +String userId
        +User? user
        +String content
        +String createdAt
        +String updatedAt
    }

    class ProjectInsight {
        +String id
        +String projectId
        +Number healthScore
        +String riskLevel (LOW/MEDIUM/HIGH)
        +String[] recommendations
        +String? delayPrediction
        +String[] bottlenecks
        +String createdAt
    }

    %% Services
    class AuthStore {
        -User? user
        -String? accessToken
        -Boolean isLoading
        -Boolean isRecoveringPassword
        +login(credentials)
        +signup(credentials)
        +logout()
        +checkAuth()
        +resetPassword(email)
        +updatePassword(newPassword)
        +cancelRecovery()
    }

    class ProjectsService {
        +getProjects()
        +getProject(id)
        +createProject(dto)
        +updateProject(id, dto)
        +deleteProject(id)
        +getTasks(projectId)
        +createTask(dto)
        +updateTask(id, dto)
        +deleteTask(id)
        +getMembers(projectId)
        +inviteMember()
    }

    class AIService {
        +generateProject(prompt)
        +generateTaskDescription(prompt)
        +breakdownTask(task)
        +analyzeProjectHealth(projectId)
        +generateMeetingSummary(notes)
        +generateSprintReport(projectId)
        +chatWorkspace(message, context)
    }

    %% Relationships
    User "1" --> "1" UserRole : has
    Project "1" --> "1" ProjectStatus : has
    Project "1" --> "1" User : owned by
    Project "1" --> "0..1" ProjectStats : has
    Project "1" --> "*" Task : contains
    Project "1" --> "*" Milestone : has
    Project "1" --> "*" Member : has
    Project "1" --> "*" Meeting : schedules
    Project "1" --> "*" Activity : logs
    Project "1" --> "0..1" ProjectInsight : has

    Task "1" --> "1" TaskStatus : has
    Task "1" --> "1" TaskPriority : has
    Task "1" --> "0..1" User : assigned to
    Task "1" --> "0..1" Milestone : belongs to
    Task "1" --> "0..1" Task : parent
    Task "1" --> "*" Comment : has

    Milestone "1" --> "*" Task : includes

    Meeting "1" --> "0..1" MeetingSummary : has
    MeetingSummary "1" --> "*" ActionItem : contains

    Member "1" --> "1" User : is
    Member "1" --> "1" Project : belongs to
```

---

## Penjelasan Class Diagram

Class Diagram ini menggambarkan struktur data (entitas) dan layanan (services) dalam sistem Bitspace:

### 1. Enums
- **UserRole**: Peran pengguna (OWNER, ADMIN, MEMBER).
- **ProjectStatus**: Status proyek (ACTIVE, ARCHIVED).
- **TaskStatus**: Status tugas (BACKLOG, TODO, IN_PROGRESS, REVIEW, DONE).
- **TaskPriority**: Prioritas tugas (LOW, MEDIUM, HIGH).

### 2. Entitas Utama
- **User**: Data pengguna aplikasi.
- **Project**: Data proyek, termasuk goal dan AI fields.
- **Task**: Data tugas dalam proyek.
- **Milestone**: Data milestone proyek.
- **Member**: Hubungan antara pengguna dan proyek (anggota tim).
- **Meeting**: Data meeting proyek beserta ringkasannya.
- **Activity**: Log aktivitas dalam proyek.
- **Comment**: Komentar pada tugas.
- **ProjectInsight**: Analisis kesehatan proyek dari AI.

### 3. Layanan (Services)
- **AuthStore**: State management autentikasi.
- **ProjectsService**: Layanan operasi proyek dan tugas.
- **AIService**: Layanan integrasi dengan AI Gemini.

### 4. Hubungan Antar Kelas
- **1 to 1**: Misal User punya 1 UserRole.
- **1 to Many**: Misal 1 Project punya banyak Task.
- **0 to 1**: Hubungan opsional, misal Project boleh tidak punya ProjectStats.
