# SoftHouse - Project Management Dashboard

A modern, high-performance project management application built with **React**, **TypeScript**, and **Supabase**.

![Dashboard Preview](https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6) 
*(Replace with actual screenshot if available)*

## Features

*   **Role-Based Access Control**: 
    *   **Owner**: Create projects, invite/remove members, manage all content.
    *   **Member**: View assigned projects, track tasks, participate in collaboration (cannot create projects).
*   **Project Management**: Kanban-style task tracking, drag-and-drop status updates.
*   **Real-time Collaboration**: Live task updates and member activity logging.
*   **Activity Feed**: Detailed audit log of all project actions (Task creation, updates, member changes).
*   **Global Search**: Instantly find projects and tasks from the header search bar.
*   **Member Stats**: Visual analytics of team performance and task completion.
*   **Secure Authentication**: Powered by Supabase Auth with Row Level Security (RLS).

## Tech Stack

*   **Frontend**: React (Vite), TypeScript, Tailwind CSS
*   **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
*   **Icons**: Lucide React
*   **Routing**: React Router DOM

## Getting Started

### 1. Prerequisites

*   Node.js (v16 or higher)
*   npm or yarn
*   A Supabase project (Free tier works perfectly)

### 2. Installation

Clone the repository:
```bash
git clone https://github.com/your-username/softhouse-dashboard.git
cd softhouse-dashboard
```

Install dependencies:
```bash
npm install
```

### 3. Environment Setup

Create a `.env` file in the root directory:
```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Database Setup (Supabase)

To set up the database, we have provided a single, clean SQL script that handles everything:
Roles, Tables, Security Policies, and Triggers.

1.  Go to your Supabase Dashboard -> **SQL Editor**.
2.  Open the file `supabase_full_schema.sql` located in this project's root.
3.  Copy the entire content and paste it into the Supabase SQL Editor.
4.  Click **Run**.

> **Note**: This script will reset the database schema. If you have existing data you want to keep, back it up first.

### 5. Run Locally

Start the development server:
```bash
npm run dev
```

Visit `http://localhost:5173` in your browser.

## Project Structure

*   `/pages`: Main application views (Dashboard, Project Detail, Login).
*   `/components`: Reusable UI components (Modals, Cards, Layout).
*   `/services`: API clients and state management (Supabase client, Auth Store).
*   `/types`: TypeScript definitions for robust type safety.

## License

MIT
