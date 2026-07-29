import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create docs/pdf_wireframes directory if it doesn't exist
const wireframesDir = path.join(__dirname, "docs", "pdf_wireframes");
if (!fs.existsSync(wireframesDir)) {
  fs.mkdirSync(wireframesDir, { recursive: true });
}

const WIDTH = 210; // A4 width in mm (approx 210mm for A4 portrait)
const HEIGHT = 297; // A4 height in mm
const SCALE = 2.83465; // Convert mm to px at 72 DPI
const PX_WIDTH = Math.round(WIDTH * SCALE);
const PX_HEIGHT = Math.round(HEIGHT * SCALE);

// Mock data
const mockProject = {
  name: "Pengembangan Aplikasi Bitspace",
  status: "On Progress",
  description: "Aplikasi manajemen proyek berbasis web untuk tim kolaborasi",
};

const mockMembers = [
  { name: "Andi Wijaya", email: "andi@bitspace.id", role: "Project Manager" },
  { name: "Siti Nurhaliza", email: "siti@bitspace.id", role: "Frontend Developer" },
  { name: "Budi Santoso", email: "budi@bitspace.id", role: "Backend Developer" },
];

const mockTasks = [
  { title: "Desain UI Dashboard", status: "Done", priority: "High", assignee: "Siti Nurhaliza", dueDate: "15/07/2024" },
  { title: "Setup Database", status: "In Progress", priority: "High", assignee: "Budi Santoso", dueDate: "20/07/2024" },
  { title: "API Authentication", status: "Todo", priority: "Medium", assignee: "Budi Santoso", dueDate: "25/07/2024" },
  { title: "Integrasi Gemini AI", status: "Todo", priority: "High", assignee: "Andi Wijaya", dueDate: "30/07/2024" },
  { title: "Testing & QA", status: "Todo", priority: "Medium", assignee: "Siti Nurhaliza", dueDate: "05/08/2024" },
];

const mockMilestones = [
  { title: "Planning Selesai", description: "Finalisasi requirement dan timeline", status: "Done", dueDate: "30/06/2024", progress: 100 },
  { title: "Development Phase 1", description: "Setup dasar dan fitur inti", status: "In Progress", dueDate: "31/07/2024", progress: 45 },
  { title: "Development Phase 2", description: "Fitur lanjutan dan AI", status: "Todo", dueDate: "31/08/2024", progress: 0 },
  { title: "Launch", description: "Deploy ke production", status: "Todo", dueDate: "15/09/2024", progress: 0 },
];

const mockActivities = [
  { time: "16/07/2024 10:30", user: "Andi Wijaya", action: "Updated Task", details: "Desain UI Dashboard - Status changed to Done" },
  { time: "16/07/2024 09:15", user: "Siti Nurhaliza", action: "Commented", details: "Menambahkan desain dark mode pada task Desain UI Dashboard" },
  { time: "15/07/2024 16:45", user: "Budi Santoso", action: "Created Milestone", details: "Development Phase 2" },
  { time: "15/07/2024 14:20", user: "Andi Wijaya", action: "Added Member", details: "Siti Nurhaliza bergabung ke proyek" },
  { time: "15/07/2024 10:00", user: "System", action: "Project Created", details: "Pengembangan Aplikasi Bitspace" },
];

const mockAIReport = `Berikut adalah analisis status proyek "Pengembangan Aplikasi Bitspace":

1. **Progress Keseluruhan**: Proyek berjalan sesuai rencana dengan 45% penyelesaian pada phase 1.
2. **Task yang Harus Diperhatikan**:
   - API Authentication (priority: High, due: 25/07/2024)
   - Integrasi Gemini AI (priority: High, due: 30/07/2024)
3. **Rekomendasi**:
   - Percepat development pada API Authentication
   - Lakukan meeting untuk membahas detail integrasi AI
4. **Kesimpulan**: Proyek dalam kondisi sehat, namun perlu perhatian pada task dengan priority tinggi.`;

const mockMeeting = {
  title: "Sprint Planning - Phase 1",
  meetingDate: "2024-07-20T10:00:00",
  meetingLink: "https://zoom.us/j/1234567890",
  meetingNotes: "1. Review backlog items\n2. Assign tasks to team members\n3. Discuss sprint goal\n4. Plan daily standups",
  retrospective: "What went well: Great teamwork on UI design.\nWhat could be improved: Communication about task dependencies.\nAction items: Set up weekly sync meetings.",
  meetingSummary: {
    summary: "Team planned the first sprint with focus on UI development and backend setup.",
    keyDecisions: ["Use Tailwind CSS for styling", "Implement REST API first", "Start with user authentication"],
    actionItems: [
      { taskTitle: "Set up project repository", description: "Initialize Git repo and add team members", suggestedAssigneeId: null },
      { taskTitle: "Design landing page mockup", description: "Create Figma designs for landing page", suggestedAssigneeId: null },
    ],
  },
};

function generateSVGHeader(reportTitle, projectName = mockProject.name) {
  const today = new Date().toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" });
  return `
    <!-- Logo placeholder -->
    <rect x="28" y="28" width="43" height="43" fill="white" stroke="black" stroke-width="1"/>
    <text x="49" y="55" font-family="Arial" font-size="16" fill="black" text-anchor="middle" font-weight="bold">B</text>
    
    <!-- Company name -->
    <text x="80" y="50" font-family="Arial" font-size="18" fill="black" font-weight="bold">Bitora Protocol</text>
    
    <!-- Print date -->
    <text x="567" y="42" font-family="Arial" font-size="9" fill="black" text-anchor="end">Tanggal Cetak:</text>
    <text x="567" y="58" font-family="Arial" font-size="9" fill="black" text-anchor="end">${today}</text>
    
    <!-- Report title -->
    <text x="297" y="95" font-family="Arial" font-size="16" fill="black" text-anchor="middle" font-weight="bold">${reportTitle}</text>
    
    <!-- Project name -->
    ${projectName ? `<text x="30" y="120" font-family="Arial" font-size="12" fill="black">Project: ${projectName}</text>` : ""}
    
    <!-- Separator -->
    <line x1="28" y1="130" x2="567" y2="130" stroke="black" stroke-width="1"/>
  `;
}

function generateSVGFooter() {
  return `
    <!-- Footer -->
    <text x="567" y="820" font-family="Arial" font-size="8" fill="black" text-anchor="end">Dicetak oleh sistem dashboard Bitora Protocol</text>
  `;
}

function generateProjectSummarySVG() {
  let memberRows = "";
  mockMembers.forEach((member, index) => {
    const y = 305 + index * 25;
    memberRows += `
      <rect x="28" y="${y}" width="150" height="20" fill="white" stroke="black" stroke-width="1"/>
      <rect x="183" y="${y}" width="180" height="20" fill="white" stroke="black" stroke-width="1"/>
      <rect x="368" y="${y}" width="120" height="20" fill="white" stroke="black" stroke-width="1"/>
      <text x="35" y="${y + 13}" font-family="Arial" font-size="9" fill="black">${member.name}</text>
      <text x="190" y="${y + 13}" font-family="Arial" font-size="9" fill="black">${member.email}</text>
      <text x="375" y="${y + 13}" font-family="Arial" font-size="9" fill="black">${member.role}</text>
    `;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${PX_WIDTH}" height="${PX_HEIGHT}" viewBox="0 0 ${PX_WIDTH} ${PX_HEIGHT}" xmlns="http://www.w3.org/2000/svg" style="background: white;">
    ${generateSVGHeader("PROJECT STATUS SUMMARY")}
    
    <!-- Project info -->
    <text x="30" y="155" font-family="Arial" font-size="11" fill="black" font-weight="bold">Status:</text>
    <text x="80" y="155" font-family="Arial" font-size="11" fill="black">${mockProject.status}</text>
    <text x="30" y="175" font-family="Arial" font-size="11" fill="black" font-weight="bold">Deskripsi:</text>
    <text x="80" y="175" font-family="Arial" font-size="11" fill="black">${mockProject.description}</text>
    
    <!-- Statistics -->
    <text x="30" y="200" font-family="Arial" font-size="11" fill="black" font-weight="bold">Statistik:</text>
    <text x="50" y="220" font-family="Arial" font-size="10" fill="black">• Total Tasks: 5</text>
    <text x="50" y="240" font-family="Arial" font-size="10" fill="black">• Completed: 1</text>
    <text x="50" y="260" font-family="Arial" font-size="10" fill="black">• Overdue: 0</text>
    
    <!-- Members table header -->
    <rect x="28" y="280" width="150" height="20" fill="#f0f0f0" stroke="black" stroke-width="1"/>
    <rect x="183" y="280" width="180" height="20" fill="#f0f0f0" stroke="black" stroke-width="1"/>
    <rect x="368" y="280" width="120" height="20" fill="#f0f0f0" stroke="black" stroke-width="1"/>
    <text x="103" y="293" font-family="Arial" font-size="9" fill="black" text-anchor="middle" font-weight="bold">Nama</text>
    <text x="273" y="293" font-family="Arial" font-size="9" fill="black" text-anchor="middle" font-weight="bold">Email</text>
    <text x="428" y="293" font-family="Arial" font-size="9" fill="black" text-anchor="middle" font-weight="bold">Role</text>
    
    <!-- Members table rows -->
    ${memberRows}
    
    ${generateSVGFooter()}
</svg>`;
}

function generateTaskListSVG() {
  let taskRows = "";
  mockTasks.forEach((task, index) => {
    const y = 160 + index * 25;
    taskRows += `
      <rect x="28" y="${y}" width="120" height="20" fill="white" stroke="black" stroke-width="1"/>
      <rect x="153" y="${y}" width="80" height="20" fill="white" stroke="black" stroke-width="1"/>
      <rect x="238" y="${y}" width="80" height="20" fill="white" stroke="black" stroke-width="1"/>
      <rect x="323" y="${y}" width="100" height="20" fill="white" stroke="black" stroke-width="1"/>
      <rect x="428" y="${y}" width="100" height="20" fill="white" stroke="black" stroke-width="1"/>
      <text x="35" y="${y + 13}" font-family="Arial" font-size="8.5" fill="black">${task.title}</text>
      <text x="193" y="${y + 13}" font-family="Arial" font-size="8.5" fill="black" text-anchor="middle">${task.status}</text>
      <text x="278" y="${y + 13}" font-family="Arial" font-size="8.5" fill="black" text-anchor="middle">${task.priority}</text>
      <text x="373" y="${y + 13}" font-family="Arial" font-size="8.5" fill="black" text-anchor="middle">${task.assignee}</text>
      <text x="478" y="${y + 13}" font-family="Arial" font-size="8.5" fill="black" text-anchor="middle">${task.dueDate}</text>
    `;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${PX_WIDTH}" height="${PX_HEIGHT}" viewBox="0 0 ${PX_WIDTH} ${PX_HEIGHT}" xmlns="http://www.w3.org/2000/svg" style="background: white;">
    ${generateSVGHeader("TASK LIST REPORT")}
    <text x="567" y="120" font-family="Arial" font-size="9" fill="black" text-anchor="end">Total Tasks: ${mockTasks.length}</text>
    
    <!-- Table header -->
    <rect x="28" y="135" width="120" height="20" fill="#f0f0f0" stroke="black" stroke-width="1"/>
    <rect x="153" y="135" width="80" height="20" fill="#f0f0f0" stroke="black" stroke-width="1"/>
    <rect x="238" y="135" width="80" height="20" fill="#f0f0f0" stroke="black" stroke-width="1"/>
    <rect x="323" y="135" width="100" height="20" fill="#f0f0f0" stroke="black" stroke-width="1"/>
    <rect x="428" y="135" width="100" height="20" fill="#f0f0f0" stroke="black" stroke-width="1"/>
    <text x="88" y="148" font-family="Arial" font-size="9" fill="black" text-anchor="middle" font-weight="bold">Judul Task</text>
    <text x="193" y="148" font-family="Arial" font-size="9" fill="black" text-anchor="middle" font-weight="bold">Status</text>
    <text x="278" y="148" font-family="Arial" font-size="9" fill="black" text-anchor="middle" font-weight="bold">Priority</text>
    <text x="373" y="148" font-family="Arial" font-size="9" fill="black" text-anchor="middle" font-weight="bold">Assignee</text>
    <text x="478" y="148" font-family="Arial" font-size="9" fill="black" text-anchor="middle" font-weight="bold">Due Date</text>
    
    <!-- Table rows -->
    ${taskRows}
    
    ${generateSVGFooter()}
</svg>`;
}

function generateMemberWorkloadSVG() {
  let workloadRows = "";
  mockMembers.forEach((member, index) => {
    const y = 160 + index * 25;
    const userTasks = mockTasks.filter((t) => t.assignee === member.name);
    const active = userTasks.filter((t) => t.status !== "Done").length;
    const completed = userTasks.filter((t) => t.status === "Done").length;
    const total = userTasks.length;

    workloadRows += `
      <rect x="28" y="${y}" width="140" height="20" fill="white" stroke="black" stroke-width="1"/>
      <rect x="173" y="${y}" width="100" height="20" fill="white" stroke="black" stroke-width="1"/>
      <rect x="278" y="${y}" width="100" height="20" fill="white" stroke="black" stroke-width="1"/>
      <rect x="383" y="${y}" width="80" height="20" fill="white" stroke="black" stroke-width="1"/>
      <text x="35" y="${y + 13}" font-family="Arial" font-size="9" fill="black">${member.name}</text>
      <text x="223" y="${y + 13}" font-family="Arial" font-size="9" fill="black" text-anchor="middle">${active}</text>
      <text x="328" y="${y + 13}" font-family="Arial" font-size="9" fill="black" text-anchor="middle">${completed}</text>
      <text x="423" y="${y + 13}" font-family="Arial" font-size="9" fill="black" text-anchor="middle">${total}</text>
    `;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${PX_WIDTH}" height="${PX_HEIGHT}" viewBox="0 0 ${PX_WIDTH} ${PX_HEIGHT}" xmlns="http://www.w3.org/2000/svg" style="background: white;">
    ${generateSVGHeader("MEMBER WORKLOAD REPORT")}
    
    <!-- Table header -->
    <rect x="28" y="135" width="140" height="20" fill="#f0f0f0" stroke="black" stroke-width="1"/>
    <rect x="173" y="135" width="100" height="20" fill="#f0f0f0" stroke="black" stroke-width="1"/>
    <rect x="278" y="135" width="100" height="20" fill="#f0f0f0" stroke="black" stroke-width="1"/>
    <rect x="383" y="135" width="80" height="20" fill="#f0f0f0" stroke="black" stroke-width="1"/>
    <text x="98" y="148" font-family="Arial" font-size="9" fill="black" text-anchor="middle" font-weight="bold">Member</text>
    <text x="223" y="148" font-family="Arial" font-size="9" fill="black" text-anchor="middle" font-weight="bold">Active Tasks</text>
    <text x="328" y="148" font-family="Arial" font-size="9" fill="black" text-anchor="middle" font-weight="bold">Completed</text>
    <text x="423" y="148" font-family="Arial" font-size="9" fill="black" text-anchor="middle" font-weight="bold">Total</text>
    
    <!-- Table rows -->
    ${workloadRows}
    
    ${generateSVGFooter()}
</svg>`;
}

function generateActivityLogSVG() {
  let activityRows = "";
  mockActivities.forEach((activity, index) => {
    const y = 160 + index * 25;
    activityRows += `
      <rect x="28" y="${y}" width="100" height="20" fill="white" stroke="black" stroke-width="1"/>
      <rect x="133" y="${y}" width="100" height="20" fill="white" stroke="black" stroke-width="1"/>
      <rect x="238" y="${y}" width="100" height="20" fill="white" stroke="black" stroke-width="1"/>
      <rect x="343" y="${y}" width="180" height="20" fill="white" stroke="black" stroke-width="1"/>
      <text x="35" y="${y + 13}" font-family="Arial" font-size="8" fill="black">${activity.time}</text>
      <text x="183" y="${y + 13}" font-family="Arial" font-size="8.5" fill="black" text-anchor="middle">${activity.user}</text>
      <text x="288" y="${y + 13}" font-family="Arial" font-size="8.5" fill="black" text-anchor="middle">${activity.action}</text>
      <text x="350" y="${y + 13}" font-family="Arial" font-size="8" fill="black">${activity.details}</text>
    `;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${PX_WIDTH}" height="${PX_HEIGHT}" viewBox="0 0 ${PX_WIDTH} ${PX_HEIGHT}" xmlns="http://www.w3.org/2000/svg" style="background: white;">
    ${generateSVGHeader("PROJECT ACTIVITY LOG")}
    
    <!-- Table header -->
    <rect x="28" y="135" width="100" height="20" fill="#f0f0f0" stroke="black" stroke-width="1"/>
    <rect x="133" y="135" width="100" height="20" fill="#f0f0f0" stroke="black" stroke-width="1"/>
    <rect x="238" y="135" width="100" height="20" fill="#f0f0f0" stroke="black" stroke-width="1"/>
    <rect x="343" y="135" width="180" height="20" fill="#f0f0f0" stroke="black" stroke-width="1"/>
    <text x="78" y="148" font-family="Arial" font-size="9" fill="black" text-anchor="middle" font-weight="bold">Waktu</text>
    <text x="183" y="148" font-family="Arial" font-size="9" fill="black" text-anchor="middle" font-weight="bold">User</text>
    <text x="288" y="148" font-family="Arial" font-size="9" fill="black" text-anchor="middle" font-weight="bold">Aksi</text>
    <text x="433" y="148" font-family="Arial" font-size="9" fill="black" text-anchor="middle" font-weight="bold">Detail</text>
    
    <!-- Table rows -->
    ${activityRows}
    
    ${generateSVGFooter()}
</svg>`;
}

function generateMilestoneReportSVG() {
  let milestoneRows = "";
  mockMilestones.forEach((milestone, index) => {
    const y = 160 + index * 25;
    milestoneRows += `
      <rect x="28" y="${y}" width="40" height="20" fill="white" stroke="black" stroke-width="1"/>
      <rect x="73" y="${y}" width="110" height="20" fill="white" stroke="black" stroke-width="1"/>
      <rect x="188" y="${y}" width="100" height="20" fill="white" stroke="black" stroke-width="1"/>
      <rect x="293" y="${y}" width="80" height="20" fill="white" stroke="black" stroke-width="1"/>
      <rect x="378" y="${y}" width="90" height="20" fill="white" stroke="black" stroke-width="1"/>
      <rect x="473" y="${y}" width="80" height="20" fill="white" stroke="black" stroke-width="1"/>
      <text x="48" y="${y + 13}" font-family="Arial" font-size="9" fill="black" text-anchor="middle">${index + 1}</text>
      <text x="128" y="${y + 13}" font-family="Arial" font-size="8.5" fill="black" text-anchor="middle">${milestone.title}</text>
      <text x="238" y="${y + 13}" font-family="Arial" font-size="8" fill="black" text-anchor="middle">${milestone.description}</text>
      <text x="333" y="${y + 13}" font-family="Arial" font-size="8.5" fill="black" text-anchor="middle">${milestone.status}</text>
      <text x="423" y="${y + 13}" font-family="Arial" font-size="8.5" fill="black" text-anchor="middle">${milestone.dueDate}</text>
      <text x="513" y="${y + 13}" font-family="Arial" font-size="9" fill="black" text-anchor="middle">${milestone.progress}%</text>
    `;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${PX_WIDTH}" height="${PX_HEIGHT}" viewBox="0 0 ${PX_WIDTH} ${PX_HEIGHT}" xmlns="http://www.w3.org/2000/svg" style="background: white;">
    ${generateSVGHeader("LAPORAN PROGRESS MILESTONE")}
    <text x="567" y="120" font-family="Arial" font-size="9" fill="black" text-anchor="end">Total Milestone: ${mockMilestones.length}</text>
    
    <!-- Table header -->
    <rect x="28" y="135" width="40" height="20" fill="#f0f0f0" stroke="black" stroke-width="1"/>
    <rect x="73" y="135" width="110" height="20" fill="#f0f0f0" stroke="black" stroke-width="1"/>
    <rect x="188" y="135" width="100" height="20" fill="#f0f0f0" stroke="black" stroke-width="1"/>
    <rect x="293" y="135" width="80" height="20" fill="#f0f0f0" stroke="black" stroke-width="1"/>
    <rect x="378" y="135" width="90" height="20" fill="#f0f0f0" stroke="black" stroke-width="1"/>
    <rect x="473" y="135" width="80" height="20" fill="#f0f0f0" stroke="black" stroke-width="1"/>
    <text x="48" y="148" font-family="Arial" font-size="9" fill="black" text-anchor="middle" font-weight="bold">No</text>
    <text x="128" y="148" font-family="Arial" font-size="9" fill="black" text-anchor="middle" font-weight="bold">Milestone</text>
    <text x="238" y="148" font-family="Arial" font-size="9" fill="black" text-anchor="middle" font-weight="bold">Deskripsi</text>
    <text x="333" y="148" font-family="Arial" font-size="9" fill="black" text-anchor="middle" font-weight="bold">Status</text>
    <text x="423" y="148" font-family="Arial" font-size="9" fill="black" text-anchor="middle" font-weight="bold">Due Date</text>
    <text x="513" y="148" font-family="Arial" font-size="9" fill="black" text-anchor="middle" font-weight="bold">Progress</text>
    
    <!-- Table rows -->
    ${milestoneRows}
    
    ${generateSVGFooter()}
</svg>`;
}

function generateAIReportSVG() {
  const lines = mockAIReport.split("\n");
  let textBlocks = "";
  let y = 155;

  lines.forEach((line) => {
    if (line.trim()) {
      textBlocks += `<text x="30" y="${y}" font-family="Arial" font-size="10" fill="black">${line}</text>`;
      y += 18;
    } else {
      y += 10;
    }
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${PX_WIDTH}" height="${PX_HEIGHT}" viewBox="0 0 ${PX_WIDTH} ${PX_HEIGHT}" xmlns="http://www.w3.org/2000/svg" style="background: white;">
    ${generateSVGHeader("AI PROJECT STATUS REPORT")}
    
    <!-- AI Report content -->
    ${textBlocks}
    
    ${generateSVGFooter()}
</svg>`;
}

function generateAllProjectsReportSVG() {
  const mockProjects = [
    { name: "Pengembangan Aplikasi Bitspace", status: "On Progress", description: "Aplikasi manajemen proyek", members: 3 },
    { name: "Redesign Website Company Profile", status: "Done", description: "Redesign UI/UX website Bitora", members: 2 },
    { name: "Mobile App Bitspace", status: "Planning", description: "Aplikasi mobile untuk manajemen proyek", members: 4 },
  ];

  let projectSections = "";
  mockProjects.forEach((project, index) => {
    const y = 155 + index * 140;
    projectSections += `
      <!-- Project ${index + 1} -->
      <text x="30" y="${y}" font-family="Arial" font-size="14" fill="black" font-weight="bold">${project.name}</text>
      <text x="30" y="${y + 25}" font-family="Arial" font-size="10" fill="black">Status: ${project.status}</text>
      <text x="30" y="${y + 45}" font-family="Arial" font-size="10" fill="black">Deskripsi: ${project.description}</text>
      <text x="30" y="${y + 65}" font-family="Arial" font-size="10" fill="#666">Anggota: ${project.members} orang</text>
      <line x1="28" y1="${y + 85}" x2="567" y2="${y + 85}" stroke="black" stroke-width="1"/>
    `;
  });

  const today = new Date().toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" });
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${PX_WIDTH}" height="${PX_HEIGHT}" viewBox="0 0 ${PX_WIDTH} ${PX_HEIGHT}" xmlns="http://www.w3.org/2000/svg" style="background: white;">
    <!-- Header (without project name) -->
    <rect x="28" y="28" width="43" height="43" fill="white" stroke="black" stroke-width="1"/>
    <text x="49" y="55" font-family="Arial" font-size="16" fill="black" text-anchor="middle" font-weight="bold">B</text>
    <text x="80" y="50" font-family="Arial" font-size="18" fill="black" font-weight="bold">Bitora Protocol</text>
    <text x="567" y="42" font-family="Arial" font-size="9" fill="black" text-anchor="end">Tanggal Cetak:</text>
    <text x="567" y="58" font-family="Arial" font-size="9" fill="black" text-anchor="end">${today}</text>
    <text x="297" y="95" font-family="Arial" font-size="16" fill="black" text-anchor="middle" font-weight="bold">ALL PROJECTS REPORT</text>
    <text x="567" y="120" font-family="Arial" font-size="9" fill="black" text-anchor="end">Total Projects: ${mockProjects.length}</text>
    <line x1="28" y1="130" x2="567" y2="130" stroke="black" stroke-width="1"/>
    
    <!-- Project sections -->
    ${projectSections}
    
    ${generateSVGFooter()}
</svg>`;
}

function generateMeetingReportSVG() {
  // Meeting Details Table
  let meetingTableRows = "";
  const meetingDetails = [
    ["Project", mockProject.name],
    ["Meeting Title", mockMeeting.title],
    ["Date", new Date(mockMeeting.meetingDate).toLocaleString("id-ID")],
    ["Link", mockMeeting.meetingLink || "None provided"],
  ];

  let tableY = 160;
  meetingDetails.forEach((row) => {
    meetingTableRows += `
      <rect x="28" y="${tableY}" width="150" height="25" fill="#f0f0f0" stroke="black" stroke-width="1"/>
      <rect x="183" y="${tableY}" width="356" height="25" fill="white" stroke="black" stroke-width="1"/>
      <text x="103" y="${tableY + 15}" font-family="Arial" font-size="10" fill="black" text-anchor="middle" font-weight="bold">${row[0]}</text>
      <text x="190" y="${tableY + 15}" font-family="Arial" font-size="10" fill="black">${row[1]}</text>
    `;
    tableY += 25;
  });

  // Retrospective / Notes
  let notesY = tableY + 20;
  let notesText = "";
  const notesLines = (mockMeeting.retrospective || "No retrospective written yet.").split("\n");
  notesLines.forEach((line) => {
    notesText += `<text x="30" y="${notesY}" font-family="Arial" font-size="10" fill="black">${line}</text>`;
    notesY += 15;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${PX_WIDTH}" height="${PX_HEIGHT}" viewBox="0 0 ${PX_WIDTH} ${PX_HEIGHT}" xmlns="http://www.w3.org/2000/svg" style="background: white;">
    <!-- Header -->
    <rect x="0" y="0" width="${PX_WIDTH}" height="85" fill="#f0f0f0" stroke="black" stroke-width="1"/>
    <text x="297" y="55" font-family="Arial" font-size="18" fill="black" text-anchor="middle" font-weight="bold">Meeting Report: ${mockMeeting.title}</text>
    
    <!-- Meeting Details Table -->
    ${meetingTableRows}
    
    <!-- Retrospective / Notes -->
    <text x="30" y="${tableY + 15}" font-family="Arial" font-size="12" fill="black" font-weight="bold">Retrospective / Notes</text>
    ${notesText}
    
    ${generateSVGFooter()}
</svg>`;
}

function generateRetrospectiveSVG() {
  // Retrospective sections
  let sections = "";
  let currentY = 150;

  const retroSections = [
    { title: "What Went Well", content: "Great teamwork on UI design. Everyone contributed valuable ideas." },
    { title: "What Could Be Improved", content: "Communication about task dependencies needs to be clearer." },
    { title: "Action Items", content: "1. Set up weekly sync meetings\n2. Document task dependencies\n3. Review progress every Friday" },
  ];

  retroSections.forEach((section) => {
    sections += `
      <!-- Section: ${section.title} -->
      <rect x="28" y="${currentY}" width="${PX_WIDTH - 56}" height="30" fill="#f0f0f0" stroke="black" stroke-width="1"/>
      <text x="35" y="${currentY + 18}" font-family="Arial" font-size="11" fill="black" font-weight="bold">${section.title}</text>
    `;
    currentY += 35;

    const contentLines = section.content.split("\n");
    contentLines.forEach((line) => {
      sections += `<text x="35" y="${currentY}" font-family="Arial" font-size="10" fill="black">${line}</text>`;
      currentY += 15;
    });
    currentY += 10;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${PX_WIDTH}" height="${PX_HEIGHT}" viewBox="0 0 ${PX_WIDTH} ${PX_HEIGHT}" xmlns="http://www.w3.org/2000/svg" style="background: white;">
    <!-- Header -->
    ${generateSVGHeader("RETROSPECTIVE REPORT")}
    
    <!-- Retrospective Sections -->
    ${sections}
    
    ${generateSVGFooter()}
</svg>`;
}

// Generate all SVG files
const reports = [
  { name: "project_summary", svg: generateProjectSummarySVG() },
  { name: "task_list", svg: generateTaskListSVG() },
  { name: "member_workload", svg: generateMemberWorkloadSVG() },
  { name: "activity_log", svg: generateActivityLogSVG() },
  { name: "milestone_report", svg: generateMilestoneReportSVG() },
  { name: "ai_report", svg: generateAIReportSVG() },
  { name: "all_projects_report", svg: generateAllProjectsReportSVG() },
  { name: "meeting_report", svg: generateMeetingReportSVG() },
  { name: "retrospective", svg: generateRetrospectiveSVG() },
];

reports.forEach((report) => {
  const filePath = path.join(wireframesDir, `${report.name}.svg`);
  fs.writeFileSync(filePath, report.svg);
  console.log(`Generated: ${filePath}`);
});

console.log("\n✅ All PDF wireframes with mock data generated successfully!");
console.log(`📁 Saved to: ${wireframesDir}`);
