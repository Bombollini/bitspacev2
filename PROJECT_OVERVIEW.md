# Bitspace - Project Overview

**Bitspace** adalah aplikasi manajemen proyek modern dan berkinerja tinggi yang dibangun dengan React, TypeScript, dan Supabase untuk tim kolaboratif.

---

## 📋 Daftar Isi

- [Informasi Umum](#informasi-umum)
- [Fitur Utama](#fitur-utama)
- [Arsitektur Teknis](#arsitektur-teknis)
- [Struktur Proyek](#struktur-proyek)
- [Tech Stack](#tech-stack)
- [Komponen Utama](#komponen-utama)
- [Database & Data Model](#database--data-model)
- [Layanan & API](#layanan--api)
- [Supabase Functions](#supabase-functions)
- [Panduan Memulai](#panduan-memulai)

---

## 📌 Informasi Umum

| Aspek            | Detail                      |
| ---------------- | --------------------------- |
| **Nama Project** | Bitspace (versi 2)          |
| **Type**         | Web Application (React SPA) |
| **Build Tool**   | Vite                        |
| **Package**      | @bitspace/web               |
| **Status**       | Development (v0.0.0)        |

---

## ✨ Fitur Utama

### 1. **Manajemen Kontrol Akses Berbasis Role**

- **Owner**: Membuat proyek, mengundang/menghapus anggota, mengelola semua konten
- **Member**: Melihat proyek yang ditugaskan, melacak tugas, berkolaborasi (tidak dapat membuat proyek)

### 2. **Manajemen Proyek**

- Sistem tracking tugas dengan gaya Kanban
- Pembaruan status drag-and-drop
- Arsip proyek yang sudah selesai
- Deskripsi proyek detail

### 3. **Pelacakan Tugas (Tasks)**

- Prioritas tugas (Low, Medium, High)
- Status tugas (Backlog, Todo, In Progress, Review, Done)
- Penugasan ke anggota tim
- Tanggal jatuh tempo (Due Date)
- Lampiran file untuk tugas
- Deskripsi detail tugas

### 4. **Milestone & Perencanaan**

- Buat dan kelola milestone proyek
- Hubungkan tugas ke milestone
- Lacak kemajuan milestone

### 5. **Pertemuan (Meetings)**

- Kelola meeting proyek
- Email notifikasi untuk pertemuan
- Detail pertemuan lengkap
- Sejarah pertemuan

### 6. **Kolaborasi Real-time**

- Pembaruan tugas langsung
- Logging aktivitas anggota
- Feed aktivitas global

### 7. **Activity Feed & Audit Log**

- Log detail dari semua aksi proyek
- Riwayat pembuatan tugas, pembaruan, perubahan anggota
- Pelacakan aktivitas pengguna

### 8. **Pencarian Global**

- Cari proyek dan tugas dari header
- Pencarian instan

### 9. **Statistik Anggota**

- Analytics visual performa tim
- Pelacakan penyelesaian tugas
- Dashboard anggota

### 10. **Otentikasi & Keamanan**

- Powered by Supabase Auth
- Row Level Security (RLS) untuk perlindungan data
- Session management yang aman

---

## 🏗️ Arsitektur Teknis

```
┌─────────────────────────────────────────────────────────┐
│                    React Frontend (Vite)                │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Pages: Dashboard, Projects, Meetings, Profile   │   │
│  │ Components: UI, Modals, Cards, Layout           │   │
│  │ State: AuthStore, React Router                  │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────┬───────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
┌───────▼────────┐ ┌─────▼──────┐ ┌──────▼───────────┐
│ Supabase Auth  │ │ PostgreSQL  │ │ Edge Functions  │
│                │ │ (Database)  │ │ (Deno)          │
└────────────────┘ └─────────────┘ └─────────────────┘

        │ RLS (Row Level Security)
        │ Real-time subscriptions
        │ API Gateway
        │
   Supabase Platform
```

---

## 📁 Struktur Proyek

```
bitspacev2/
├── src/
│   ├── App.tsx                 # Root component dengan routing
│   ├── index.tsx               # Entry point
│   ├── index.css               # Global styles
│   ├── constants.ts            # Konfigurasi global
│   ├── types.ts                # TypeScript interfaces & enums
│   │
│   ├── pages/                  # Route pages
│   │   ├── DashboardPage.tsx   # Dashboard overview
│   │   ├── LoginPage.tsx       # Autentikasi
│   │   ├── ProjectsPage.tsx    # Daftar proyek
│   │   ├── ProjectDetailPage.tsx
│   │   ├── MeetingsPage.tsx    # Daftar meeting
│   │   ├── MeetingDetailPage.tsx
│   │   └── ProfilePage.tsx     # Profil pengguna
│   │
│   ├── components/             # Reusable UI components
│   │   ├── Layout.tsx          # Layout container
│   │   ├── TaskCard.tsx        # Kartu tugas individual
│   │   ├── TaskModal.tsx       # Modal untuk buat/edit tugas
│   │   ├── TaskDetailModal.tsx # Detail modal tugas
│   │   ├── NewProjectModal.tsx # Modal buat proyek baru
│   │   ├── NewMeetingModal.tsx # Modal buat meeting baru
│   │   ├── MilestoneList.tsx   # Daftar milestone
│   │   ├── InviteMemberModal.tsx
│   │   └── Badge.tsx           # Badge status
│   │
│   ├── services/               # Business logic & API
│   │   ├── apiClient.ts        # HTTP client (Axios)
│   │   ├── authStore.tsx       # Auth state management (React Context)
│   │   ├── projects.service.ts # Project API service
│   │   └── supabaseClient.ts   # Supabase client initialization
│   │
│   ├── utils/                  # Utility functions
│   │   ├── pdfGenerator.ts     # Generate PDF reports
│   │   └── seedDemoData.ts     # Demo data seeding
│   │
│   ├── supabase/               # Supabase configuration
│   │   ├── config.toml         # Supabase project config
│   │   └── functions/          # Edge functions (Deno)
│   │       ├── send-meeting-email/  # Email notifications
│   │       └── gemini-ai/           # AI integration (potential)
│   │
│   └── public/                 # Static assets
│
├── Configuration Files
│   ├── package.json            # Dependencies & scripts
│   ├── vite.config.ts          # Vite configuration
│   ├── tsconfig.json           # TypeScript configuration
│   ├── index.html              # HTML entry point
│   └── vite-env.d.ts           # Vite environment types
│
└── Documentation & Data
    ├── README.md               # Setup guide
    ├── PROJECT_OVERVIEW.md     # File ini
    ├── seed_projects.sql       # Database seed script
    ├── supabase_full_schema.sql
    ├── migrations/             # Database migrations
    │   ├── meetings_migration.sql
    │   ├── milestones_migration.sql
    │   └── task_attachments_migration.sql
    └── Debug files
        ├── diagnose_output.txt
        ├── debug_projects.js
        ├── check_auth_raw.js
        ├── check_connection.js
        └── disable_rls.sql
```

---

## 🔧 Tech Stack

### Frontend

- **React** 19.2.3 - UI library
- **TypeScript** 5.8 - Type safety
- **Vite** 6.2 - Build tool & dev server
- **React Router DOM** 7.11 - Routing
- **Tailwind CSS** - Styling (via HTML classes)
- **Lucide React** 0.562 - Icon library

### Backend & Services

- **Supabase** - Backend-as-a-Service
  - PostgreSQL Database
  - Authentication (Email/Password)
  - Real-time Subscriptions
  - Row Level Security (RLS)
  - Edge Functions
  - Storage
- **Deno** - Serverless functions runtime
- **Resend** - Email service (via Edge Functions)

### HTTP & API

- **Axios** 1.13 - HTTP client
- **Supabase JS Client** 2.39 - Supabase SDK

### Utilities

- **jsPDF** 4.0 - PDF generation
- **jsPDF-autotable** 5.0 - PDF table generation

---

## 🧩 Komponen Utama

### Pages (Route Components)

| Komponen          | Path                   | Tujuan                |
| ----------------- | ---------------------- | --------------------- |
| LoginPage         | `/login`               | Autentikasi pengguna  |
| DashboardPage     | `/dashboard`           | Overview dashboard    |
| ProjectsPage      | `/projects`            | Daftar semua proyek   |
| ProjectDetailPage | `/projects/:projectId` | Detail proyek & tugas |
| MeetingsPage      | `/meetings`            | Daftar meeting        |
| MeetingDetailPage | `/meetings/:meetingId` | Detail meeting        |
| ProfilePage       | `/profile`             | Profil pengguna       |

### Components (Reusable UI)

| Komponen          | Fungsi                                 |
| ----------------- | -------------------------------------- |
| Layout            | Container layout dengan sidebar/header |
| TaskCard          | Menampilkan kartu tugas individual     |
| TaskModal         | Modal untuk membuat/mengedit tugas     |
| TaskDetailModal   | Modal menampilkan detail tugas lengkap |
| NewProjectModal   | Modal membuat proyek baru              |
| NewMeetingModal   | Modal membuat meeting baru             |
| MilestoneList     | Daftar milestone dalam proyek          |
| InviteMemberModal | Modal mengundang anggota tim           |
| Badge             | Komponen badge untuk status/priority   |

---

## 📊 Database & Data Model

### Core Entities

#### 1. **User**

```typescript
{
  id: string
  email: string
  name: string
  avatarUrl?: string
  role: UserRole (OWNER | MEMBER)
  createdAt: string
}
```

#### 2. **Project**

```typescript
{
  id: string
  name: string
  description?: string
  ownerId: string
  status: ProjectStatus (ACTIVE | ARCHIVED)
  createdAt: string
  updatedAt: string
  stats?: ProjectStats {
    totalTasks: number
    completedTasks: number
    overdueTasks: number
  }
}
```

#### 3. **Task**

```typescript
{
  id: string
  projectId: string
  milestoneId?: string
  title: string
  description?: string
  status: TaskStatus (BACKLOG | TODO | IN_PROGRESS | REVIEW | DONE)
  priority: TaskPriority (LOW | MEDIUM | HIGH)
  assigneeId?: string
  assignee?: User
  dueDate?: string
  attachmentUrl?: string
  createdAt: string
  updatedAt: string
}
```

#### 4. **Milestone**

```typescript
{
  id: string
  projectId: string
  name: string
  dueDate?: string
  description?: string
  status?: string
}
```

#### 5. **Meeting**

```typescript
{
  id: string
  projectId: string
  title: string
  description?: string
  date: string
  participants?: User[]
}
```

#### 6. **Activity Log**

- Tracks all project actions
- User, action type, timestamp, changes
- Audit trail untuk compliance

---

## 🔌 Layanan & API

### authStore.tsx

- **Tujuan**: State management untuk autentikasi
- **Fungsi Utama**:
  - `useAuth()` - Hook untuk akses auth state
  - Sign up, login, logout
  - Session persistence
  - User context provider

### projects.service.ts

- **Tujuan**: Business logic untuk project operations
- **Fungsi**:
  - Fetch projects
  - Create/update/delete project
  - Fetch tasks
  - Create/update/delete task
  - Update task status
  - Manage project members

### apiClient.ts

- **Tujuan**: HTTP client abstraction
- **Features**:
  - Axios instance dengan defaults
  - Error handling
  - Request/response interceptors
  - Mock mode support

### supabaseClient.ts

- **Tujuan**: Inisialisasi Supabase client
- **Konfigurasi**:
  - VITE_SUPABASE_URL
  - VITE_SUPABASE_ANON_KEY
  - Database connection

---

## 🚀 Supabase Functions

### send-meeting-email

**Path**: `supabase/functions/send-meeting-email/`

**Tujuan**: Mengirim notifikasi email untuk meeting baru

**Features**:

- Trigger ketika meeting dibuat
- Integrase dengan Resend API untuk email
- CORS headers untuk cross-origin requests
- Error handling graceful

**Environment Variables**:

- `RESEND_API_KEY` - API key untuk Resend email service

**Payload**:

```json
{
  "to": ["email@example.com"],
  "subject": "string",
  "html": "string"
}
```

### gemini-ai

**Path**: `supabase/functions/gemini-ai/`

**Status**: Placeholder untuk integrasi AI (Gemini API)

**Tujuan Potensial**:

- Task description generation
- Smart task suggestions
- Meeting summary generation

---

## 📚 Scripts & Migrations

### Database Migrations

- `meetings_migration.sql` - Schema untuk meetings
- `milestones_migration.sql` - Schema untuk milestones
- `task_attachments_migration.sql` - Schema untuk task attachments

### Seed Data

- `seed_projects.sql` - Demo projects & tasks
- `seed_demo_data.ts` - Seedable demo data (TypeScript)

### Debug Utilities

- `check_auth_raw.js` - Debug autentikasi
- `check_connection.js` - Test database connection
- `disable_rls.sql` - RLS configuration
- `debug_projects.js` - Debug project queries

---

## 📖 Panduan Memulai

### Prerequisites

- Node.js v16+
- npm atau yarn
- Supabase project (free tier sudah cukup)

### 1. Setup Environment

```bash
# Install dependencies
npm install

# Buat .env file
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_API_BASE_URL=your_api_url  # Optional
```

### 2. Development Server

```bash
npm run dev
# Buka http://localhost:5173
```

### 3. Build Production

```bash
npm run build
npm run preview
```

### 4. Database Setup

```bash
# Run migrations
psql -h your_host -U postgres -d postgres < supabase_full_schema.sql

# Seed demo data (optional)
psql -h your_host -U postgres -d postgres < seed_projects.sql
```

---

## 🔐 Security Features

1. **Supabase Auth**
   - Email/password authentication
   - Session management
   - JWT tokens

2. **Row Level Security (RLS)**
   - Data isolation by user
   - Owner-only project access
   - Member-restricted task access

3. **Type Safety**
   - Full TypeScript coverage
   - Runtime validation potential

---

## 🎯 Fitur Rencana (Potential Features)

- [ ] AI-powered task suggestions (Gemini integration)
- [ ] Team productivity analytics
- [ ] Task automation/workflows
- [ ] Gantt chart view
- [ ] Integration dengan Slack/Teams
- [ ] Mobile app (React Native)
- [ ] Dark mode support
- [ ] Custom themes

---

## 📝 Notes

- **Mock Mode**: Aplikasi dapat berjalan tanpa API backend jika `VITE_API_BASE_URL` kosong
- **PDF Generation**: Fitur export task/report ke PDF tersedia
- **Real-time**: Supabase subscriptions untuk real-time updates
- **State Management**: Menggunakan React Context + Hook pattern (minimal library)

---

## 📞 Support & Resources

- [Supabase Docs](https://supabase.com/docs)
- [React Documentation](https://react.dev)
- [Vite Guide](https://vitejs.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)

---

**Last Updated**: 15 Juni 2026  
**Version**: 0.0.0 (Development)
