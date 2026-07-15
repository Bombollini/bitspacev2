import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUTPUT_DIR = path.join(__dirname, "docs", "wireframes");

// Pastikan direktori output ada
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const WIDTH = 1440;
const HEIGHT = 1024;
const STROKE_COLOR = "#000000";
const BG_COLOR = "#FFFFFF";

// Escape XML special characters
function escapeXml(unsafe) {
  return unsafe.replace(/[&<>"']/g, function (c) {
    switch (c) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&apos;";
    }
  });
}

// Helper untuk menyimpan SVG
function saveSVG(svgContent, filename) {
  const filePath = path.join(OUTPUT_DIR, filename);
  fs.writeFileSync(filePath, svgContent);
  console.log(`Generated: ${filename}`);
}

// Helper: Chart Bar Hitam Putih
function barChart(x, y, width, height, data) {
  const chartWidth = width - 40;
  const chartHeight = height - 80;
  const maxValue = Math.max(...data.map((d) => d.value));
  const barWidth = chartWidth / data.length - 16;

  let bars = "";
  data.forEach((d, i) => {
    const barHeight = (d.value / maxValue) * chartHeight;
    const barX = x + 20 + i * (barWidth + 16);
    const barY = y + 40 + chartHeight - barHeight;
    bars += `
      <rect x="${barX}" y="${barY}" width="${barWidth}" height="${barHeight}" fill="none" stroke="${STROKE_COLOR}" />
      <text x="${barX + barWidth / 2}" y="${y + 50 + chartHeight}" font-family="Arial" font-size="10" text-anchor="middle" fill="${STROKE_COLOR}">${d.label}</text>
    `;
  });

  return `
    <g>
      <!-- Sumbu Y -->
      <line x1="${x + 20}" y1="${y + 40}" x2="${x + 20}" y2="${y + 40 + chartHeight}" stroke="${STROKE_COLOR}" />
      <!-- Sumbu X -->
      <line x1="${x + 20}" y1="${y + 40 + chartHeight}" x2="${x + 20 + chartWidth}" y2="${y + 40 + chartHeight}" stroke="${STROKE_COLOR}" />
      ${bars}
    </g>
  `;
}

// Helper: Chart Pie Hitam Putih
function pieChart(x, y, radius, segments) {
  let segmentsHtml = "";
  let startAngle = -90;
  const total = segments.reduce((sum, s) => sum + s.value, 0);

  segments.forEach((segment) => {
    const angle = (segment.value / total) * 360;
    const endAngle = startAngle + angle;

    // Hitung titik awal dan akhir arc
    const startX = x + radius * Math.cos((startAngle * Math.PI) / 180);
    const startY = y + radius * Math.sin((startAngle * Math.PI) / 180);
    const endX = x + radius * Math.cos((endAngle * Math.PI) / 180);
    const endY = y + radius * Math.sin((endAngle * Math.PI) / 180);

    const largeArcFlag = angle > 180 ? 1 : 0;

    segmentsHtml += `
      <path d="M ${x} ${y} L ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY} Z" 
            fill="none" stroke="${STROKE_COLOR}" />
    `;

    startAngle = endAngle;
  });

  return `
    <g>
      <circle cx="${x}" cy="${y}" r="${radius}" fill="none" stroke="${STROKE_COLOR}" />
      ${segmentsHtml}
    </g>
  `;
}

// Helper: Chart Line Hitam Putih
function lineChart(x, y, width, height, data) {
  const chartWidth = width - 40;
  const chartHeight = height - 80;
  const maxValue = Math.max(...data.map((d) => d.value));
  const pointSpacing = chartWidth / (data.length - 1);

  let points = [];
  let dots = "";
  data.forEach((d, i) => {
    const pointX = x + 20 + i * pointSpacing;
    const pointY = y + 40 + chartHeight - (d.value / maxValue) * chartHeight;
    points.push(`${pointX},${pointY}`);
    dots += `<circle cx="${pointX}" cy="${pointY}" r="4" fill="${BG_COLOR}" stroke="${STROKE_COLOR}" />`;
  });

  return `
    <g>
      <!-- Sumbu Y -->
      <line x1="${x + 20}" y1="${y + 40}" x2="${x + 20}" y2="${y + 40 + chartHeight}" stroke="${STROKE_COLOR}" />
      <!-- Sumbu X -->
      <line x1="${x + 20}" y1="${y + 40 + chartHeight}" x2="${x + 20 + chartWidth}" y2="${y + 40 + chartHeight}" stroke="${STROKE_COLOR}" />
      <!-- Garis -->
      <polyline points="${points.join(" ")}" fill="none" stroke="${STROKE_COLOR}" stroke-width="2" />
      ${dots}
      <!-- Label X -->
      ${data.map((d, i) => `<text x="${x + 20 + i * pointSpacing}" y="${y + 50 + chartHeight}" font-family="Arial" font-size="10" text-anchor="middle" fill="${STROKE_COLOR}">${d.label}</text>`).join("")}
    </g>
  `;
}

// Komponen UI umum: Sidebar
function sidebar(currentRoute) {
  const navItems = [
    { name: "Dashboard", href: "/dashboard", adminOnly: false },
    { name: "Projects", href: "/projects", adminOnly: false },
    { name: "Meetings", href: "/meetings", adminOnly: false },
    { name: "Admin", href: "/admin", adminOnly: true },
    { name: "Settings", href: "/profile", adminOnly: false },
  ];

  let navHtml = "";
  let y = 180;
  navItems.forEach((item) => {
    if (item.adminOnly && currentRoute !== "/admin") return;
    const isActive = currentRoute === item.href || (item.href !== "/admin" && currentRoute.startsWith(item.href));
    navHtml += `
      <rect x="24" y="${y}" width="208" height="40" rx="8" fill="none" stroke="${STROKE_COLOR}" />
      <text x="36" y="${y + 25}" font-family="Arial" font-size="14" fill="${STROKE_COLOR}">${item.name}</text>
    `;
    y += 48;
  });

  return `
    <rect x="0" y="0" width="256" height="${HEIGHT}" fill="${BG_COLOR}" stroke="${STROKE_COLOR}" />
    <g transform="translate(0, 0)">
      <rect x="24" y="24" width="32" height="32" rx="8" fill="none" stroke="${STROKE_COLOR}" />
      <text x="68" y="46" font-family="Arial" font-size="20" font-weight="bold" fill="${STROKE_COLOR}">Bitspace</text>
      <line x1="24" y1="88" x2="232" y2="88" stroke="${STROKE_COLOR}" />
      
      ${navHtml}
      
      <rect x="0" y="${HEIGHT - 120}" width="256" height="120" fill="${BG_COLOR}" stroke="${STROKE_COLOR}" />
      <rect x="24" y="${HEIGHT - 104}" width="208" height="72" rx="8" fill="none" stroke="${STROKE_COLOR}" />
      <circle cx="56" cy="${HEIGHT - 68}" r="20" fill="none" stroke="${STROKE_COLOR}" />
      <text x="84" y="${HEIGHT - 73}" font-family="Arial" font-size="14" fill="${STROKE_COLOR}">Alex Developer</text>
      <text x="84" y="${HEIGHT - 56}" font-family="Arial" font-size="12" fill="${STROKE_COLOR}">Owner</text>
      <rect x="24" y="${HEIGHT - 24}" width="208" height="40" rx="8" fill="none" stroke="${STROKE_COLOR}" />
      <text x="36" y="${HEIGHT - 2}" font-family="Arial" font-size="14" fill="${STROKE_COLOR}">Logout</text>
    </g>
  `;
}

// Komponen UI umum: Header
function header() {
  return `
    <rect x="272" y="16" width="1144" height="64" rx="12" fill="${BG_COLOR}" stroke="${STROKE_COLOR}" />
    <g transform="translate(272, 16)">
      <rect x="20" y="12" width="520" height="40" rx="8" fill="none" stroke="${STROKE_COLOR}" />
      <text x="40" y="38" font-family="Arial" font-size="14" fill="${STROKE_COLOR}">Search projects or tasks...</text>
      
      <circle cx="1080" cy="32" r="20" fill="none" stroke="${STROKE_COLOR}" />
      <circle cx="1120" cy="32" r="20" fill="none" stroke="${STROKE_COLOR}" />
    </g>
  `;
}

// Komponen UI umum: Project Tabs
function projectTabs(activeTab) {
  const tabs = [
    { id: "milestones", label: "Milestones" },
    { id: "tasks", label: "Tasks" },
    { id: "overview", label: "Overview" },
    { id: "members", label: "Members" },
    { id: "activity", label: "Activity" },
    { id: "ai_report", label: "AI Report" },
    { id: "ai_health", label: "AI Health" },
  ];

  let tabsHtml = "";
  let x = 8;
  tabs.forEach((tab) => {
    const isActive = tab.id === activeTab;
    tabsHtml += `
      <rect x="${x}" y="6" width="${tab.label.length * 10 + 40}" height="40" rx="8" fill="none" stroke="${STROKE_COLOR}" />
      <text x="${x + (tab.label.length * 10 + 40) / 2}" y="31" font-family="Arial" font-size="12" text-anchor="middle" fill="${STROKE_COLOR}">${tab.label}</text>
    `;
    x += tab.label.length * 10 + 40 + 16;
  });

  return `
    <g transform="translate(0, 110)">
      <rect x="0" y="0" width="1000" height="52" rx="12" fill="none" stroke="${STROKE_COLOR}" />
      <g transform="translate(0, 0)">
        ${tabsHtml}
      </g>
    </g>
  `;
}

// Komponen: Task Card
function taskCard(x, y, title, description, priority, assignee) {
  return `
    <rect x="${x}" y="${y}" width="180" height="120" rx="12" fill="${BG_COLOR}" stroke="${STROKE_COLOR}" />
    <text x="${x + 12}" y="${y + 30}" font-family="Arial" font-size="14" font-weight="bold" fill="${STROKE_COLOR}">${title}</text>
    <text x="${x + 12}" y="${y + 52}" font-family="Arial" font-size="11" fill="${STROKE_COLOR}">${description}</text>
    <rect x="${x + 12}" y="${y + 64}" width="60" height="24" rx="12" fill="none" stroke="${STROKE_COLOR}" />
    <text x="${x + 42}" y="${y + 80}" font-family="Arial" font-size="10" text-anchor="middle" fill="${STROKE_COLOR}">${priority}</text>
    <circle cx="${x + 156}" cy="${y + 100}" r="12" fill="none" stroke="${STROKE_COLOR}" />
  `;
}

// Komponen: Project Card
function projectCard(x, y, title, description, progress, members) {
  return `
    <rect x="${x}" y="${y}" width="556" height="180" rx="16" fill="${BG_COLOR}" stroke="${STROKE_COLOR}" />
    <rect x="${x + 20}" y="${y + 20}" width="56" height="56" rx="12" fill="${BG_COLOR}" stroke="${STROKE_COLOR}" />
    <text x="${x + 92}" y="${y + 45}" font-family="Arial" font-size="16" font-weight="bold" fill="${STROKE_COLOR}">${title}</text>
    <text x="${x + 92}" y="${y + 68}" font-family="Arial" font-size="12" fill="${STROKE_COLOR}">${description}</text>
    <rect x="${x + 20}" y="${y + 100}" width="516" height="8" rx="4" fill="none" stroke="${STROKE_COLOR}" />
    <rect x="${x + 20}" y="${y + 100}" width="${516 * progress}" height="8" rx="4" fill="${STROKE_COLOR}" />
    <text x="${x + 20}" y="${y + 130}" font-family="Arial" font-size="12" fill="${STROKE_COLOR}">${Math.round(progress * 100)}% complete • ${members} members</text>
    ${[...Array(members)].map((_, i) => `<circle cx="${x + 500 - i * 28}" cy="${y + 150}" r="12" fill="none" stroke="${STROKE_COLOR}" />`).join("")}
  `;
}

// Komponen: Activity Item
function activityItem(x, y, user, action, time) {
  return `
    <g>
      <circle cx="${x + 24}" cy="${y + 24}" r="16" fill="none" stroke="${STROKE_COLOR}" />
      <text x="${x + 56}" y="${y + 28}" font-family="Arial" font-size="14" fill="${STROKE_COLOR}">${user}</text>
      <text x="${x + 56}" y="${y + 48}" font-family="Arial" font-size="12" fill="${STROKE_COLOR}">${action}</text>
      <text x="${x + 56}" y="${y + 68}" font-family="Arial" font-size="10" fill="${STROKE_COLOR}">${time}</text>
    </g>
  `;
}

// 1. Halaman Login
function generateLoginPage() {
  const svg = `
<svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${WIDTH}" height="${HEIGHT}" fill="${BG_COLOR}" />
  
  <!-- Form Login -->
  <rect x="520" y="200" width="400" height="524" rx="20" fill="${BG_COLOR}" stroke="${STROKE_COLOR}" />
  <g transform="translate(520, 200)">
    <!-- Logo -->
    <rect x="164" y="40" width="72" height="72" rx="16" fill="none" stroke="${STROKE_COLOR}" />
    <text x="200" y="140" font-family="Arial" font-size="24" font-weight="bold" fill="${STROKE_COLOR}" text-anchor="middle">Bitspace</text>
    
    <!-- Email -->
    <text x="40" y="200" font-family="Arial" font-size="14" fill="${STROKE_COLOR}">Email</text>
    <rect x="40" y="212" width="320" height="48" rx="8" fill="none" stroke="${STROKE_COLOR}" />
    <text x="56" y="242" font-family="Arial" font-size="14" fill="${STROKE_COLOR}">alex@example.com</text>
    
    <!-- Password -->
    <text x="40" y="292" font-family="Arial" font-size="14" fill="${STROKE_COLOR}">Password</text>
    <rect x="40" y="304" width="320" height="48" rx="8" fill="none" stroke="${STROKE_COLOR}" />
    <text x="56" y="334" font-family="Arial" font-size="14" fill="${STROKE_COLOR}">••••••••••</text>
    
    <!-- Remember Me -->
    <rect x="40" y="364" width="16" height="16" rx="4" fill="none" stroke="${STROKE_COLOR}" />
    <text x="66" y="376" font-family="Arial" font-size="12" fill="${STROKE_COLOR}">Remember me</text>
    <text x="270" y="376" font-family="Arial" font-size="12" fill="${STROKE_COLOR}">Forgot password?</text>
    
    <!-- Tombol -->
    <rect x="40" y="404" width="320" height="48" rx="8" fill="none" stroke="${STROKE_COLOR}" />
    <text x="200" y="434" font-family="Arial" font-size="16" font-weight="bold" fill="${STROKE_COLOR}" text-anchor="middle">Sign In</text>
    
    <!-- Footer -->
    <text x="200" y="490" font-family="Arial" font-size="14" fill="${STROKE_COLOR}" text-anchor="middle">Don't have an account? Sign Up</text>
  </g>
</svg>`;
  saveSVG(svg, "login.svg");
}

// 2. Halaman Reset Password
function generateResetPasswordPage() {
  const svg = `
<svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${WIDTH}" height="${HEIGHT}" fill="${BG_COLOR}" />
  
  <!-- Form Reset Password -->
  <rect x="520" y="200" width="400" height="524" rx="20" fill="${BG_COLOR}" stroke="${STROKE_COLOR}" />
  <g transform="translate(520, 200)">
    <!-- Logo -->
    <rect x="164" y="40" width="72" height="72" rx="16" fill="none" stroke="${STROKE_COLOR}" />
    <text x="200" y="140" font-family="Arial" font-size="24" font-weight="bold" fill="${STROKE_COLOR}" text-anchor="middle">Bitspace</text>
    
    <!-- New Password -->
    <text x="40" y="200" font-family="Arial" font-size="14" fill="${STROKE_COLOR}">New Password</text>
    <rect x="40" y="212" width="320" height="48" rx="8" fill="none" stroke="${STROKE_COLOR}" />
    <text x="56" y="242" font-family="Arial" font-size="14" fill="${STROKE_COLOR}">••••••••••</text>
    <!-- Indikator Strength -->
    <rect x="40" y="268" width="100" height="6" rx="3" fill="${STROKE_COLOR}" />
    <rect x="148" y="268" width="100" height="6" rx="3" fill="none" stroke="${STROKE_COLOR}" />
    <rect x="256" y="268" width="104" height="6" rx="3" fill="none" stroke="${STROKE_COLOR}" />
    
    <!-- Confirm Password -->
    <text x="40" y="312" font-family="Arial" font-size="14" fill="${STROKE_COLOR}">Confirm New Password</text>
    <rect x="40" y="324" width="320" height="48" rx="8" fill="none" stroke="${STROKE_COLOR}" />
    <text x="56" y="354" font-family="Arial" font-size="14" fill="${STROKE_COLOR}">••••••••••</text>
    
    <!-- Tombol -->
    <rect x="40" y="394" width="320" height="48" rx="8" fill="none" stroke="${STROKE_COLOR}" />
    <text x="200" y="424" font-family="Arial" font-size="16" font-weight="bold" fill="${STROKE_COLOR}" text-anchor="middle">Reset Password</text>
    
    <!-- Footer -->
    <text x="200" y="490" font-family="Arial" font-size="14" fill="${STROKE_COLOR}" text-anchor="middle">Back to Login</text>
  </g>
</svg>`;
  saveSVG(svg, "reset_password.svg");
}

// 3. Halaman Dashboard
function generateDashboardPage() {
  const svg = `
<svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${WIDTH}" height="${HEIGHT}" fill="${BG_COLOR}" />
  
  ${sidebar("/dashboard")}
  ${header()}
  
  <!-- Konten Utama -->
  <g transform="translate(272, 112)">
    <!-- Judul Halaman -->
    <text x="0" y="30" font-family="Arial" font-size="32" font-weight="bold" fill="${STROKE_COLOR}">Dashboard Overview</text>
    <text x="0" y="55" font-family="Arial" font-size="14" fill="${STROKE_COLOR}">Track your team's progress across all active developments</text>
    
    <!-- Statistik -->
    <g transform="translate(0, 80)">
      <rect x="0" y="0" width="276" height="88" rx="16" fill="${BG_COLOR}" stroke="${STROKE_COLOR}" />
      <text x="24" y="44" font-family="Arial" font-size="12" fill="${STROKE_COLOR}">Active Projects</text>
      <text x="24" y="70" font-family="Arial" font-size="24" font-weight="bold" fill="${STROKE_COLOR}">5</text>
      
      <rect x="296" y="0" width="276" height="88" rx="16" fill="${BG_COLOR}" stroke="${STROKE_COLOR}" />
      <text x="320" y="44" font-family="Arial" font-size="12" fill="${STROKE_COLOR}">Total Tasks</text>
      <text x="320" y="70" font-family="Arial" font-size="24" font-weight="bold" fill="${STROKE_COLOR}">42</text>
      
      <rect x="592" y="0" width="276" height="88" rx="16" fill="${BG_COLOR}" stroke="${STROKE_COLOR}" />
      <text x="616" y="44" font-family="Arial" font-size="12" fill="${STROKE_COLOR}">Completed</text>
      <text x="616" y="70" font-family="Arial" font-size="24" font-weight="bold" fill="${STROKE_COLOR}">28</text>
      
      <rect x="888" y="0" width="276" height="88" rx="16" fill="${BG_COLOR}" stroke="${STROKE_COLOR}" />
      <text x="912" y="44" font-family="Arial" font-size="12" fill="${STROKE_COLOR}">Overdue</text>
      <text x="912" y="70" font-family="Arial" font-size="24" font-weight="bold" fill="${STROKE_COLOR}">3</text>
    </g>
    
    <!-- Grafik -->
    <g transform="translate(0, 200)">
      <!-- Grafik Progress Proyek (Bar Chart) -->
      <rect x="0" y="0" width="556" height="320" rx="16" fill="${BG_COLOR}" stroke="${STROKE_COLOR}" />
      <text x="24" y="40" font-family="Arial" font-size="18" font-weight="bold" fill="${STROKE_COLOR}">Project Progress</text>
      ${barChart(0, 0, 556, 320, [
        { label: "Neural", value: 80 },
        { label: "E-Commerce", value: 50 },
        { label: "Mobile", value: 95 },
        { label: "API", value: 70 },
        { label: "Design", value: 60 },
      ])}
      
      <!-- Pie Chart Task Status -->
      <rect x="588" y="0" width="556" height="320" rx="16" fill="${BG_COLOR}" stroke="${STROKE_COLOR}" />
      <text x="612" y="40" font-family="Arial" font-size="18" font-weight="bold" fill="${STROKE_COLOR}">Task Status</text>
      ${pieChart(800, 180, 80, [
        { label: "Done", value: 28 },
        { label: "In Progress", value: 10 },
        { label: "To Do", value: 4 },
      ])}
      <!-- Legend -->
      <g transform="translate(612, 260)">
        <rect x="0" y="0" width="12" height="12" rx="6" fill="none" stroke="${STROKE_COLOR}" />
        <text x="24" y="10" font-family="Arial" font-size="12" fill="${STROKE_COLOR}">Done</text>
        <rect x="100" y="0" width="12" height="12" rx="6" fill="none" stroke="${STROKE_COLOR}" />
        <text x="124" y="10" font-family="Arial" font-size="12" fill="${STROKE_COLOR}">In Progress</text>
        <rect x="220" y="0" width="12" height="12" rx="6" fill="none" stroke="${STROKE_COLOR}" />
        <text x="244" y="10" font-family="Arial" font-size="12" fill="${STROKE_COLOR}">To Do</text>
      </g>
    </g>
  </g>
</svg>`;
  saveSVG(svg, "dashboard.svg");
}

// 4. Halaman Projects
function generateProjectsPage() {
  const svg = `
<svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${WIDTH}" height="${HEIGHT}" fill="${BG_COLOR}" />
  
  ${sidebar("/projects")}
  ${header()}
  
  <!-- Konten Utama -->
  <g transform="translate(272, 112)">
    <!-- Judul Halaman -->
    <text x="0" y="30" font-family="Arial" font-size="32" font-weight="bold" fill="${STROKE_COLOR}">All Projects</text>
    
    <!-- Filter & Create -->
    <rect x="700" y="0" width="200" height="40" rx="8" fill="none" stroke="${STROKE_COLOR}" />
    <text x="720" y="26" font-family="Arial" font-size="12" fill="${STROKE_COLOR}">Filter...</text>
    <rect x="920" y="0" width="224" height="40" rx="8" fill="none" stroke="${STROKE_COLOR}" />
    <text x="1032" y="26" font-family="Arial" font-size="14" font-weight="bold" fill="${STROKE_COLOR}" text-anchor="middle">Create Project</text>
    
    <!-- Grid Projects -->
    <g transform="translate(0, 80)">
      ${projectCard(0, 0, "Neural Network", "AI-powered task management system", 0.8, 4)}
      ${projectCard(588, 0, "E-Commerce Platform", "Modern shopping experience", 0.5, 3)}
      ${projectCard(0, 212, "Mobile App Redesign", "UI/UX overhaul for iOS & Android", 0.95, 5)}
      ${projectCard(588, 212, "API Gateway", "Microservices integration layer", 0.3, 2)}
    </g>
  </g>
</svg>`;
  saveSVG(svg, "projects.svg");
}

// 5. Halaman Project Detail - Milestones
function generateProjectDetailMilestonesPage() {
  const svg = `
<svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${WIDTH}" height="${HEIGHT}" fill="${BG_COLOR}" />
  
  ${sidebar("/projects")}
  ${header()}
  
  <!-- Konten Utama -->
  <g transform="translate(272, 112)">
    <!-- Header Proyek -->
    <text x="0" y="30" font-family="Arial" font-size="32" font-weight="bold" fill="${STROKE_COLOR}">Neural Network</text>
    <g transform="translate(0, 45)">
      <rect x="0" y="0" width="92" height="28" rx="14" fill="${BG_COLOR}" stroke="${STROKE_COLOR}" />
      <text x="46" y="18" font-family="Arial" font-size="12" fill="${STROKE_COLOR}" text-anchor="middle">In Progress</text>
      <rect x="108" y="0" width="112" height="28" rx="14" fill="${BG_COLOR}" stroke="${STROKE_COLOR}" />
      <text x="164" y="18" font-family="Arial" font-size="12" fill="${STROKE_COLOR}" text-anchor="middle">4 members</text>
      <rect x="236" y="0" width="116" height="28" rx="14" fill="${BG_COLOR}" stroke="${STROKE_COLOR}" />
      <text x="294" y="18" font-family="Arial" font-size="12" fill="${STROKE_COLOR}" text-anchor="middle">80% complete</text>
    </g>
    
    ${projectTabs("milestones")}
    
    <!-- Konten Milestones -->
    <g transform="translate(0, 190)">
      <rect x="0" y="0" width="1144" height="600" rx="16" fill="${BG_COLOR}" stroke="${STROKE_COLOR}" />
      <text x="24" y="40" font-family="Arial" font-size="18" font-weight="bold" fill="${STROKE_COLOR}">Milestones Timeline</text>
      <rect x="24" y="60" width="1096" height="520" rx="8" fill="${BG_COLOR}" stroke="${STROKE_COLOR}" />
      
      <!-- Timeline -->
      <g transform="translate(40, 80)">
        <!-- Garis waktu utama -->
        <line x1="30" y1="0" x2="30" y2="480" stroke="${STROKE_COLOR}" stroke-width="3" />
        
        <!-- Milestone 1: Done -->
        <circle cx="30" cy="40" r="12" fill="${STROKE_COLOR}" stroke="${STROKE_COLOR}" />
        <rect x="60" y="20" width="1000" height="80" rx="8" fill="${BG_COLOR}" stroke="${STROKE_COLOR}" />
        <text x="80" y="45" font-family="Arial" font-size="14" font-weight="bold" fill="${STROKE_COLOR}">Project Setup</text>
        <text x="80" y="65" font-family="Arial" font-size="12" fill="${STROKE_COLOR}">Completed: 2024-01-15</text>
        <rect x="900" y="45" width="60" height="24" rx="12" fill="none" stroke="${STROKE_COLOR}" />
        <text x="930" y="60" font-family="Arial" font-size="10" text-anchor="middle" fill="${STROKE_COLOR}">Done</text>
        
        <!-- Milestone 2: Active -->
        <circle cx="30" cy="160" r="12" fill="${BG_COLOR}" stroke="${STROKE_COLOR}" stroke-width="3" />
        <rect x="60" y="140" width="1000" height="80" rx="8" fill="${BG_COLOR}" stroke="${STROKE_COLOR}" />
        <text x="80" y="165" font-family="Arial" font-size="14" font-weight="bold" fill="${STROKE_COLOR}">MVP Development</text>
        <text x="80" y="185" font-family="Arial" font-size="12" fill="${STROKE_COLOR}">Due: 2024-02-28 • 75% complete</text>
        <rect x="900" y="165" width="80" height="24" rx="12" fill="none" stroke="${STROKE_COLOR}" />
        <text x="940" y="180" font-family="Arial" font-size="10" text-anchor="middle" fill="${STROKE_COLOR}">Active</text>
        <!-- Progress -->
        <rect x="80" y="200" width="960" height="8" rx="4" fill="none" stroke="${STROKE_COLOR}" />
        <rect x="80" y="200" width="720" height="8" rx="4" fill="${STROKE_COLOR}" />
        
        <!-- Milestone 3: Upcoming -->
        <circle cx="30" cy="280" r="12" fill="${BG_COLOR}" stroke="${STROKE_COLOR}" />
        <rect x="60" y="260" width="1000" height="80" rx="8" fill="${BG_COLOR}" stroke="${STROKE_COLOR}" />
        <text x="80" y="285" font-family="Arial" font-size="14" font-weight="bold" fill="${STROKE_COLOR}">Beta Testing</text>
        <text x="80" y="305" font-family="Arial" font-size="12" fill="${STROKE_COLOR}">Due: 2024-03-30</text>
        <rect x="900" y="285" width="80" height="24" rx="12" fill="none" stroke="${STROKE_COLOR}" />
        <text x="940" y="300" font-family="Arial" font-size="10" text-anchor="middle" fill="${STROKE_COLOR}">Upcoming</text>
        
        <!-- Milestone 4: Future -->
        <circle cx="30" cy="400" r="12" fill="${BG_COLOR}" stroke="${STROKE_COLOR}" />
        <rect x="60" y="380" width="1000" height="80" rx="8" fill="${BG_COLOR}" stroke="${STROKE_COLOR}" />
        <text x="80" y="405" font-family="Arial" font-size="14" font-weight="bold" fill="${STROKE_COLOR}">Launch</text>
        <text x="80" y="425" font-family="Arial" font-size="12" fill="${STROKE_COLOR}">Due: 2024-04-30</text>
      </g>
    </g>
  </g>
</svg>`;
  saveSVG(svg, "project_detail_milestones.svg");
}

// 6. Halaman Project Detail - Tasks
function generateProjectDetailTasksPage() {
  const svg = `
<svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${WIDTH}" height="${HEIGHT}" fill="${BG_COLOR}" />
  
  ${sidebar("/projects")}
  ${header()}
  
  <!-- Konten Utama -->
  <g transform="translate(272, 112)">
    <!-- Header Proyek -->
    <text x="0" y="30" font-family="Arial" font-size="32" font-weight="bold" fill="${STROKE_COLOR}">Neural Network</text>
    <!-- Action buttons -->
    <rect x="700" y="0" width="140" height="40" rx="8" fill="none" stroke="${STROKE_COLOR}" />
    <text x="770" y="26" font-family="Arial" font-size="12" font-weight="bold" fill="${STROKE_COLOR}" text-anchor="middle">Auto-Plan (AI)</text>
    <rect x="860" y="0" width="280" height="40" rx="8" fill="none" stroke="${STROKE_COLOR}" />
    <text x="1000" y="26" font-family="Arial" font-size="12" fill="${STROKE_COLOR}">Filter tasks...</text>
    
    ${projectTabs("tasks")}
    
    <!-- Kanban Board -->
    <g transform="translate(0, 190)">
      <!-- Kolom Backlog -->
      <rect x="0" y="0" width="200" height="600" rx="0" fill="${BG_COLOR}" stroke="${STROKE_COLOR}" />
      <text x="20" y="30" font-family="Arial" font-size="14" font-weight="bold" fill="${STROKE_COLOR}">Backlog</text>
      <rect x="160" y="15" width="30" height="24" rx="12" fill="none" stroke="${STROKE_COLOR}" />
      <text x="175" y="30" font-family="Arial" font-size="10" text-anchor="middle" fill="${STROKE_COLOR}">8</text>
      ${taskCard(10, 50, "Research ML", "Explore different architectures", "Medium", "")}
      ${taskCard(10, 190, "Write Docs", "API documentation", "Low", "")}
      
      <!-- Kolom To Do -->
      <rect x="232" y="0" width="200" height="600" rx="0" fill="${BG_COLOR}" stroke="${STROKE_COLOR}" />
      <text x="252" y="30" font-family="Arial" font-size="14" font-weight="bold" fill="${STROKE_COLOR}">To Do</text>
      <rect x="392" y="15" width="30" height="24" rx="12" fill="none" stroke="${STROKE_COLOR}" />
      <text x="407" y="30" font-family="Arial" font-size="10" text-anchor="middle" fill="${STROKE_COLOR}">5</text>
      ${taskCard(242, 50, "Setup DB", "Configure PostgreSQL", "High", "")}
      
      <!-- Kolom In Progress -->
      <rect x="464" y="0" width="200" height="600" rx="0" fill="${BG_COLOR}" stroke="${STROKE_COLOR}" />
      <text x="484" y="30" font-family="Arial" font-size="14" font-weight="bold" fill="${STROKE_COLOR}">In Progress</text>
      <rect x="624" y="15" width="30" height="24" rx="12" fill="none" stroke="${STROKE_COLOR}" />
      <text x="639" y="30" font-family="Arial" font-size="10" text-anchor="middle" fill="${STROKE_COLOR}">6</text>
      ${taskCard(474, 50, "Build API", "RESTful endpoints", "High", "")}
      ${taskCard(474, 190, "Design System", "Component library", "Low", "")}
      
      <!-- Kolom Review -->
      <rect x="696" y="0" width="200" height="600" rx="0" fill="${BG_COLOR}" stroke="${STROKE_COLOR}" />
      <text x="716" y="30" font-family="Arial" font-size="14" font-weight="bold" fill="${STROKE_COLOR}">Review</text>
      <rect x="856" y="15" width="30" height="24" rx="12" fill="none" stroke="${STROKE_COLOR}" />
      <text x="871" y="30" font-family="Arial" font-size="10" text-anchor="middle" fill="${STROKE_COLOR}">4</text>
      ${taskCard(706, 50, "Code Review", "Auth module PR", "Medium", "")}
      
      <!-- Kolom Done -->
      <rect x="928" y="0" width="200" height="600" rx="0" fill="${BG_COLOR}" stroke="${STROKE_COLOR}" />
      <text x="948" y="30" font-family="Arial" font-size="14" font-weight="bold" fill="${STROKE_COLOR}">Done</text>
      <rect x="1068" y="15" width="30" height="24" rx="12" fill="none" stroke="${STROKE_COLOR}" />
      <text x="1083" y="30" font-family="Arial" font-size="10" text-anchor="middle" fill="${STROKE_COLOR}">19</text>
      ${taskCard(938, 50, "Project Setup", "Initial configuration", "High", "")}
      ${taskCard(938, 190, "Initial Design", "Wireframes", "Medium", "")}
    </g>
  </g>
</svg>`;
  saveSVG(svg, "project_detail_tasks.svg");
}

// 7. Halaman Project Detail - Overview
function generateProjectDetailOverviewPage() {
  const svg = `
<svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${WIDTH}" height="${HEIGHT}" fill="${BG_COLOR}" />
  
  ${sidebar("/projects")}
  ${header()}
  
  <!-- Konten Utama -->
  <g transform="translate(272, 112)">
    <!-- Header Proyek -->
    <text x="0" y="30" font-family="Arial" font-size="32" font-weight="bold" fill="${STROKE_COLOR}">Neural Network</text>
    
    ${projectTabs("overview")}
    
    <!-- Konten Overview -->
    <g transform="translate(0, 190)">
      <!-- Kiri: Deskripsi & Info -->
      <rect x="0" y="0" width="556" height="600" rx="16" fill="${BG_COLOR}" stroke="${STROKE_COLOR}" />
      <text x="24" y="40" font-family="Arial" font-size="18" font-weight="bold" fill="${STROKE_COLOR}">Project Details</text>
      <g transform="translate(24, 60)">
        <text x="0" y="30" font-family="Arial" font-size="12" fill="${STROKE_COLOR}">Description</text>
        <rect x="0" y="40" width="508" height="80" rx="8" fill="none" stroke="${STROKE_COLOR}" />
        <text x="16" y="65" font-family="Arial" font-size="12" fill="${STROKE_COLOR}">AI-powered task management system with smart features</text>
        
        <text x="0" y="150" font-family="Arial" font-size="12" fill="${STROKE_COLOR}">Start Date</text>
        <rect x="0" y="160" width="240" height="48" rx="8" fill="none" stroke="${STROKE_COLOR}" />
        <text x="16" y="190" font-family="Arial" font-size="12" fill="${STROKE_COLOR}">2024-01-01</text>
        
        <text x="268" y="150" font-family="Arial" font-size="12" fill="${STROKE_COLOR}">Due Date</text>
        <rect x="268" y="160" width="240" height="48" rx="8" fill="none" stroke="${STROKE_COLOR}" />
        <text x="284" y="190" font-family="Arial" font-size="12" fill="${STROKE_COLOR}">2024-04-30</text>
        
        <!-- Tags -->
        <text x="0" y="230" font-family="Arial" font-size="12" fill="${STROKE_COLOR}">Tags</text>
        <g transform="translate(0, 240)">
          <rect x="0" y="0" width="80" height="32" rx="16" fill="none" stroke="${STROKE_COLOR}" />
          <text x="40" y="20" font-family="Arial" font-size="10" text-anchor="middle" fill="${STROKE_COLOR}">AI</text>
          <rect x="96" y="0" width="100" height="32" rx="16" fill="none" stroke="${STROKE_COLOR}" />
          <text x="146" y="20" font-family="Arial" font-size="10" text-anchor="middle" fill="${STROKE_COLOR}">ML</text>
          <rect x="212" y="0" width="120" height="32" rx="16" fill="none" stroke="${STROKE_COLOR}" />
          <text x="272" y="20" font-family="Arial" font-size="10" text-anchor="middle" fill="${STROKE_COLOR}">Productivity</text>
        </g>
      </g>
      
      <!-- Kanan: Charts -->
      <rect x="588" y="0" width="556" height="280" rx="16" fill="${BG_COLOR}" stroke="${STROKE_COLOR}" />
      <text x="612" y="40" font-family="Arial" font-size="18" font-weight="bold" fill="${STROKE_COLOR}">Task Progress</text>
      ${lineChart(588, 0, 556, 280, [
        { label: "Week 1", value: 5 },
        { label: "Week 2", value: 12 },
        { label: "Week 3", value: 18 },
        { label: "Week 4", value: 28 },
        { label: "Week 5", value: 32 },
      ])}
      
      <rect x="588" y="320" width="556" height="280" rx="16" fill="${BG_COLOR}" stroke="${STROKE_COLOR}" />
      <text x="612" y="360" font-family="Arial" font-size="18" font-weight="bold" fill="${STROKE_COLOR}">Team Workload</text>
      ${barChart(588, 320, 556, 280, [
        { label: "Alex", value: 15 },
        { label: "Sarah", value: 12 },
        { label: "Mike", value: 18 },
        { label: "Emma", value: 10 },
      ])}
    </g>
  </g>
</svg>`;
  saveSVG(svg, "project_detail_overview.svg");
}

// 8. Halaman Project Detail - Members
function generateProjectDetailMembersPage() {
  const svg = `
<svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${WIDTH}" height="${HEIGHT}" fill="${BG_COLOR}" />
  
  ${sidebar("/projects")}
  ${header()}
  
  <!-- Konten Utama -->
  <g transform="translate(272, 112)">
    <!-- Header Proyek -->
    <text x="0" y="30" font-family="Arial" font-size="32" font-weight="bold" fill="${STROKE_COLOR}">Neural Network</text>
    <rect x="920" y="0" width="224" height="40" rx="8" fill="none" stroke="${STROKE_COLOR}" />
    <text x="1032" y="26" font-family="Arial" font-size="14" font-weight="bold" fill="${STROKE_COLOR}" text-anchor="middle">Invite Member</text>
    
    ${projectTabs("members")}
    
    <!-- Konten Members -->
    <g transform="translate(0, 190)">
      <rect x="0" y="0" width="1144" height="600" rx="16" fill="${BG_COLOR}" stroke="${STROKE_COLOR}" />
      <text x="24" y="40" font-family="Arial" font-size="18" font-weight="bold" fill="${STROKE_COLOR}">Team Members</text>
      
      <!-- Tabel -->
      <g transform="translate(24, 60)">
        <!-- Header -->
        <rect x="0" y="0" width="1096" height="56" fill="${BG_COLOR}" stroke="${STROKE_COLOR}" />
        <text x="24" y="34" font-family="Arial" font-size="12" font-weight="bold" fill="${STROKE_COLOR}">NAME</text>
        <text x="350" y="34" font-family="Arial" font-size="12" font-weight="bold" fill="${STROKE_COLOR}">ROLE</text>
        <text x="550" y="34" font-family="Arial" font-size="12" font-weight="bold" fill="${STROKE_COLOR}">TASKS</text>
        <text x="750" y="34" font-family="Arial" font-size="12" font-weight="bold" fill="${STROKE_COLOR}">ACTIVITY</text>
        <text x="950" y="34" font-family="Arial" font-size="12" font-weight="bold" fill="${STROKE_COLOR}">ACTIONS</text>
        
        <!-- Row 1: Owner -->
        <rect x="0" y="56" width="1096" height="100" fill="${BG_COLOR}" stroke="${STROKE_COLOR}" />
        <circle cx="56" cy="106" r="28" fill="none" stroke="${STROKE_COLOR}" />
        <text x="100" y="96" font-family="Arial" font-size="14" font-weight="bold" fill="${STROKE_COLOR}">Alex Developer</text>
        <text x="100" y="116" font-family="Arial" font-size="12" fill="${STROKE_COLOR}">alex@example.com</text>
        <rect x="350" y="86" width="100" height="32" rx="16" fill="none" stroke="${STROKE_COLOR}" />
        <text x="400" y="106" font-family="Arial" font-size="12" text-anchor="middle" fill="${STROKE_COLOR}">Owner</text>
        <text x="550" y="106" font-family="Arial" font-size="14" fill="${STROKE_COLOR}">15 tasks</text>
        
        <!-- Row 2: Designer -->
        <rect x="0" y="156" width="1096" height="100" fill="${BG_COLOR}" stroke="${STROKE_COLOR}" />
        <circle cx="56" cy="206" r="28" fill="none" stroke="${STROKE_COLOR}" />
        <text x="100" y="196" font-family="Arial" font-size="14" font-weight="bold" fill="${STROKE_COLOR}">Sarah Designer</text>
        <text x="100" y="216" font-family="Arial" font-size="12" fill="${STROKE_COLOR}">sarah@example.com</text>
        <rect x="350" y="186" width="100" height="32" rx="16" fill="none" stroke="${STROKE_COLOR}" />
        <text x="400" y="206" font-family="Arial" font-size="12" text-anchor="middle" fill="${STROKE_COLOR}">Designer</text>
        <text x="550" y="206" font-family="Arial" font-size="14" fill="${STROKE_COLOR}">12 tasks</text>
        
        <!-- Row 3: Engineer -->
        <rect x="0" y="256" width="1096" height="100" fill="${BG_COLOR}" stroke="${STROKE_COLOR}" />
        <circle cx="56" cy="306" r="28" fill="none" stroke="${STROKE_COLOR}" />
        <text x="100" y="296" font-family="Arial" font-size="14" font-weight="bold" fill="${STROKE_COLOR}">Mike Engineer</text>
        <text x="100" y="316" font-family="Arial" font-size="12" fill="${STROKE_COLOR}">mike@example.com</text>
        <rect x="350" y="286" width="100" height="32" rx="16" fill="none" stroke="${STROKE_COLOR}" />
        <text x="400" y="306" font-family="Arial" font-size="12" text-anchor="middle" fill="${STROKE_COLOR}">Engineer</text>
        <text x="550" y="306" font-family="Arial" font-size="14" fill="${STROKE_COLOR}">18 tasks</text>
        
        <!-- Row 4: QA -->
        <rect x="0" y="356" width="1096" height="100" fill="${BG_COLOR}" stroke="${STROKE_COLOR}" />
        <circle cx="56" cy="406" r="28" fill="none" stroke="${STROKE_COLOR}" />
        <text x="100" y="396" font-family="Arial" font-size="14" font-weight="bold" fill="${STROKE_COLOR}">Emma QA</text>
        <text x="100" y="416" font-family="Arial" font-size="12" fill="${STROKE_COLOR}">emma@example.com</text>
        <rect x="350" y="386" width="100" height="32" rx="16" fill="none" stroke="${STROKE_COLOR}" />
        <text x="400" y="406" font-family="Arial" font-size="12" text-anchor="middle" fill="${STROKE_COLOR}">QA</text>
        <text x="550" y="406" font-family="Arial" font-size="14" fill="${STROKE_COLOR}">10 tasks</text>
      </g>
    </g>
  </g>
</svg>`;
  saveSVG(svg, "project_detail_members.svg");
}

// 9. Halaman Project Detail - Activity
function generateProjectDetailActivityPage() {
  const svg = `
<svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${WIDTH}" height="${HEIGHT}" fill="${BG_COLOR}" />
  
  ${sidebar("/projects")}
  ${header()}
  
  <!-- Konten Utama -->
  <g transform="translate(272, 112)">
    <!-- Header Proyek -->
    <text x="0" y="30" font-family="Arial" font-size="32" font-weight="bold" fill="${STROKE_COLOR}">Neural Network</text>
    
    ${projectTabs("activity")}
    
    <!-- Activity Feed -->
    <g transform="translate(0, 190)">
      <rect x="0" y="0" width="1144" height="600" rx="16" fill="${BG_COLOR}" stroke="${STROKE_COLOR}" />
      <text x="24" y="40" font-family="Arial" font-size="18" font-weight="bold" fill="${STROKE_COLOR}">Recent Activity</text>
      
      <g transform="translate(24, 60)">
        ${activityItem(0, 0, "Alex Developer", "created a new task: Build API Endpoints", "2 minutes ago")}
        ${activityItem(0, 90, "Sarah Designer", "updated task status to In Progress", "15 minutes ago")}
        ${activityItem(0, 180, "Mike Engineer", "completed task: Project Setup", "1 hour ago")}
        ${activityItem(0, 270, "Alex Developer", "invited Sarah Designer to the project", "2 hours ago")}
        ${activityItem(0, 360, "System", "milestone MVP Development progress updated to 75%", "3 hours ago")}
      </g>
    </g>
  </g>
</svg>`;
  saveSVG(svg, "project_detail_activity.svg");
}

// 10. Halaman Project Detail - AI Report
function generateProjectDetailAiReportPage() {
  const svg = `
<svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${WIDTH}" height="${HEIGHT}" fill="${BG_COLOR}" />
  
  ${sidebar("/projects")}
  ${header()}
  
  <!-- Konten Utama -->
  <g transform="translate(272, 112)">
    <!-- Header Proyek -->
    <text x="0" y="30" font-family="Arial" font-size="32" font-weight="bold" fill="${STROKE_COLOR}">Neural Network</text>
    
    ${projectTabs("ai_report")}
    
    <!-- Konten AI Report -->
    <g transform="translate(0, 190)">
      <rect x="0" y="0" width="1144" height="600" rx="16" fill="${BG_COLOR}" stroke="${STROKE_COLOR}" />
      <text x="24" y="40" font-family="Arial" font-size="18" font-weight="bold" fill="${STROKE_COLOR}">AI Generated Report</text>
      
      <g transform="translate(24, 60)">
        <!-- Summary -->
        <rect x="0" y="0" width="1096" height="150" rx="8" fill="${BG_COLOR}" stroke="${STROKE_COLOR}" />
        <text x="20" y="30" font-family="Arial" font-size="14" font-weight="bold" fill="${STROKE_COLOR}">Executive Summary</text>
        <text x="20" y="55" font-family="Arial" font-size="12" fill="${STROKE_COLOR}">Project is on track. Team productivity is high. No major risks identified.</text>
        
        <!-- Rekomendasi -->
        <rect x="0" y="170" width="1096" height="200" rx="8" fill="${BG_COLOR}" stroke="${STROKE_COLOR}" />
        <text x="20" y="200" font-family="Arial" font-size="14" font-weight="bold" fill="${STROKE_COLOR}">Recommendations</text>
        <g transform="translate(20, 220)">
          <rect x="0" y="0" width="1056" height="40" rx="8" fill="none" stroke="${STROKE_COLOR}" />
          <text x="16" y="25" font-family="Arial" font-size="12" fill="${STROKE_COLOR}">1. Consider adding more QA resources for the upcoming beta testing phase</text>
          <rect x="0" y="50" width="1056" height="40" rx="8" fill="none" stroke="${STROKE_COLOR}" />
          <text x="16" y="75" font-family="Arial" font-size="12" fill="${STROKE_COLOR}">2. Schedule a design review for the new dashboard components</text>
        </g>
        
        <!-- Performance -->
        <rect x="0" y="390" width="540" height="180" rx="8" fill="${BG_COLOR}" stroke="${STROKE_COLOR}" />
        <text x="20" y="420" font-family="Arial" font-size="14" font-weight="bold" fill="${STROKE_COLOR}">Performance Metrics</text>
        ${pieChart(270, 500, 60, [
          { label: "On Track", value: 80 },
          { label: "At Risk", value: 15 },
          { label: "Behind", value: 5 },
        ])}
        
        <rect x="556" y="390" width="540" height="180" rx="8" fill="${BG_COLOR}" stroke="${STROKE_COLOR}" />
        <text x="576" y="420" font-family="Arial" font-size="14" font-weight="bold" fill="${STROKE_COLOR}">Task Completion Trend</text>
        ${barChart(556, 390, 540, 180, [
          { label: "Mon", value: 3 },
          { label: "Tue", value: 5 },
          { label: "Wed", value: 7 },
          { label: "Thu", value: 6 },
          { label: "Fri", value: 4 },
        ])}
      </g>
    </g>
  </g>
</svg>`;
  saveSVG(svg, "project_detail_ai_report.svg");
}

// 11. Halaman Project Detail - AI Health
function generateProjectDetailAiHealthPage() {
  const svg = `
<svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${WIDTH}" height="${HEIGHT}" fill="${BG_COLOR}" />
  
  ${sidebar("/projects")}
  ${header()}
  
  <!-- Konten Utama -->
  <g transform="translate(272, 112)">
    <!-- Header Proyek -->
    <text x="0" y="30" font-family="Arial" font-size="32" font-weight="bold" fill="${STROKE_COLOR}">Neural Network</text>
    
    ${projectTabs("ai_health")}
    
    <!-- Konten AI Health -->
    <g transform="translate(0, 190)">
      <rect x="0" y="0" width="1144" height="600" rx="16" fill="${BG_COLOR}" stroke="${STROKE_COLOR}" />
      <text x="24" y="40" font-family="Arial" font-size="18" font-weight="bold" fill="${STROKE_COLOR}">AI Health Analysis</text>
      
      <g transform="translate(24, 60)">
        <!-- Overall Health Score -->
        <rect x="0" y="0" width="1096" height="200" rx="8" fill="${BG_COLOR}" stroke="${STROKE_COLOR}" />
        <circle cx="548" cy="100" r="60" fill="none" stroke="${STROKE_COLOR}" stroke-width="8" />
        <text x="548" y="90" font-family="Arial" font-size="36" font-weight="bold" text-anchor="middle" fill="${STROKE_COLOR}">85</text>
        <text x="548" y="120" font-family="Arial" font-size="14" text-anchor="middle" fill="${STROKE_COLOR}">Health Score</text>
        <text x="548" y="150" font-family="Arial" font-size="12" text-anchor="middle" fill="${STROKE_COLOR}">Good condition</text>
        
        <!-- Factor Scores -->
        <rect x="0" y="220" width="540" height="300" rx="8" fill="${BG_COLOR}" stroke="${STROKE_COLOR}" />
        <text x="20" y="250" font-family="Arial" font-size="14" font-weight="bold" fill="${STROKE_COLOR}">Health Factors</text>
        
        <g transform="translate(20, 270)">
          <!-- Timeline -->
          <text x="0" y="20" font-family="Arial" font-size="12" fill="${STROKE_COLOR}">Timeline</text>
          <rect x="150" y="5" width="350" height="12" rx="6" fill="none" stroke="${STROKE_COLOR}" />
          <rect x="150" y="5" width="315" height="12" rx="6" fill="${STROKE_COLOR}" />
          <text x="520" y="15" font-family="Arial" font-size="10" fill="${STROKE_COLOR}">90%</text>
          
          <!-- Budget -->
          <text x="0" y="60" font-family="Arial" font-size="12" fill="${STROKE_COLOR}">Budget</text>
          <rect x="150" y="45" width="350" height="12" rx="6" fill="none" stroke="${STROKE_COLOR}" />
          <rect x="150" y="45" width="280" height="12" rx="6" fill="${STROKE_COLOR}" />
          <text x="520" y="55" font-family="Arial" font-size="10" fill="${STROKE_COLOR}">80%</text>
          
          <!-- Team Morale -->
          <text x="0" y="100" font-family="Arial" font-size="12" fill="${STROKE_COLOR}">Team Morale</text>
          <rect x="150" y="85" width="350" height="12" rx="6" fill="none" stroke="${STROKE_COLOR}" />
          <rect x="150" y="85" width="332" height="12" rx="6" fill="${STROKE_COLOR}" />
          <text x="520" y="95" font-family="Arial" font-size="10" fill="${STROKE_COLOR}">95%</text>
          
          <!-- Scope -->
          <text x="0" y="140" font-family="Arial" font-size="12" fill="${STROKE_COLOR}">Scope Control</text>
          <rect x="150" y="125" width="350" height="12" rx="6" fill="none" stroke="${STROKE_COLOR}" />
          <rect x="150" y="125" width="262" height="12" rx="6" fill="${STROKE_COLOR}" />
          <text x="520" y="135" font-family="Arial" font-size="10" fill="${STROKE_COLOR}">75%</text>
        </g>
        
        <!-- Risk Factors -->
        <rect x="556" y="220" width="540" height="300" rx="8" fill="${BG_COLOR}" stroke="${STROKE_COLOR}" />
        <text x="576" y="250" font-family="Arial" font-size="14" font-weight="bold" fill="${STROKE_COLOR}">Risk Factors</text>
        
        <g transform="translate(576, 270)">
          <rect x="0" y="0" width="500" height="60" rx="8" fill="${BG_COLOR}" stroke="${STROKE_COLOR}" />
          <text x="16" y="25" font-family="Arial" font-size="12" font-weight="bold" fill="${STROKE_COLOR}">Medium Risk</text>
          <text x="16" y="45" font-family="Arial" font-size="11" fill="${STROKE_COLOR}">Beta testing deadline approaching - recommend adding QA resources</text>
          
          <rect x="0" y="80" width="500" height="60" rx="8" fill="${BG_COLOR}" stroke="${STROKE_COLOR}" />
          <text x="16" y="105" font-family="Arial" font-size="12" font-weight="bold" fill="${STROKE_COLOR}">Low Risk</text>
          <text x="16" y="125" font-family="Arial" font-size="11" fill="${STROKE_COLOR}">Minor scope creep observed - monitor closely</text>
        </g>
      </g>
    </g>
  </g>
</svg>`;
  saveSVG(svg, "project_detail_ai_health.svg");
}

// 12. Halaman Profile
function generateProfilePage() {
  const svg = `
<svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${WIDTH}" height="${HEIGHT}" fill="${BG_COLOR}" />
  
  ${sidebar("/profile")}
  ${header()}
  
  <!-- Konten Utama -->
  <g transform="translate(272, 112)">
    <text x="0" y="30" font-family="Arial" font-size="32" font-weight="bold" fill="${STROKE_COLOR}">My Profile</text>
    
    <rect x="0" y="80" width="1144" height="600" rx="16" fill="${BG_COLOR}" stroke="${STROKE_COLOR}" />
    
    <g transform="translate(30, 110)">
      <!-- Avatar & Name -->
      <circle cx="80" cy="80" r="60" fill="none" stroke="${STROKE_COLOR}" />
      <text x="180" y="70" font-family="Arial" font-size="20" font-weight="bold" fill="${STROKE_COLOR}">Alex Developer</text>
      <text x="180" y="95" font-family="Arial" font-size="14" fill="${STROKE_COLOR}">Owner • Joined Jan 2024</text>
      
      <!-- Form -->
      <g transform="translate(0, 140)">
        <text x="0" y="30" font-family="Arial" font-size="14" fill="${STROKE_COLOR}">Full Name</text>
        <rect x="0" y="40" width="500" height="48" rx="8" fill="none" stroke="${STROKE_COLOR}" />
        <text x="16" y="70" font-family="Arial" font-size="14" fill="${STROKE_COLOR}">Alex Developer</text>
        
        <text x="548" y="30" font-family="Arial" font-size="14" fill="${STROKE_COLOR}">Email</text>
        <rect x="548" y="40" width="536" height="48" rx="8" fill="none" stroke="${STROKE_COLOR}" />
        <text x="564" y="70" font-family="Arial" font-size="14" fill="${STROKE_COLOR}">alex@example.com</text>
        
        <text x="0" y="130" font-family="Arial" font-size="14" fill="${STROKE_COLOR}">Role</text>
        <rect x="0" y="140" width="500" height="48" rx="8" fill="none" stroke="${STROKE_COLOR}" />
        <text x="16" y="170" font-family="Arial" font-size="14" fill="${STROKE_COLOR}">Owner</text>
        
        <text x="548" y="130" font-family="Arial" font-size="14" fill="${STROKE_COLOR}">Time Zone</text>
        <rect x="548" y="140" width="536" height="48" rx="8" fill="none" stroke="${STROKE_COLOR}" />
        <text x="564" y="170" font-family="Arial" font-size="14" fill="${STROKE_COLOR}">UTC+7</text>
        
        <!-- Bio -->
        <text x="0" y="230" font-family="Arial" font-size="14" fill="${STROKE_COLOR}">Bio</text>
        <rect x="0" y="240" width="1084" height="100" rx="8" fill="none" stroke="${STROKE_COLOR}" />
        <text x="16" y="270" font-family="Arial" font-size="12" fill="${STROKE_COLOR}">Full-stack developer and tech enthusiast. Love building products that help teams work better together.</text>
        
        <!-- Buttons -->
        <rect x="0" y="370" width="200" height="48" rx="12" fill="none" stroke="${STROKE_COLOR}" />
        <text x="100" y="400" font-family="Arial" font-size="14" font-weight="bold" fill="${STROKE_COLOR}" text-anchor="middle">Save Changes</text>
        
        <rect x="232" y="370" width="200" height="48" rx="12" fill="none" stroke="${STROKE_COLOR}" />
        <text x="332" y="400" font-family="Arial" font-size="14" font-weight="bold" fill="${STROKE_COLOR}" text-anchor="middle">Change Password</text>
      </g>
    </g>
  </g>
</svg>`;
  saveSVG(svg, "profile.svg");
}

// 13. Halaman Meetings
function generateMeetingsPage() {
  const svg = `
<svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${WIDTH}" height="${HEIGHT}" fill="${BG_COLOR}" />
  
  ${sidebar("/meetings")}
  ${header()}
  
  <!-- Konten Utama -->
  <g transform="translate(272, 112)">
    <text x="0" y="30" font-family="Arial" font-size="32" font-weight="bold" fill="${STROKE_COLOR}">Meetings</text>
    <rect x="920" y="0" width="224" height="40" rx="8" fill="none" stroke="${STROKE_COLOR}" />
    <text x="1032" y="26" font-family="Arial" font-size="14" font-weight="bold" fill="${STROKE_COLOR}" text-anchor="middle">Schedule Meeting</text>
    
    <!-- Meetings List -->
    <g transform="translate(0, 80)">
      <!-- Meeting 1 -->
      <rect x="0" y="0" width="1144" height="120" rx="16" fill="${BG_COLOR}" stroke="${STROKE_COLOR}" />
      <text x="24" y="40" font-family="Arial" font-size="16" font-weight="bold" fill="${STROKE_COLOR}">Sprint Planning</text>
      <text x="24" y="65" font-family="Arial" font-size="12" fill="${STROKE_COLOR}">Tomorrow, 10:00 AM - 11:00 AM</text>
      <text x="24" y="90" font-family="Arial" font-size="12" fill="${STROKE_COLOR}">Neural Network Project • 4 attendees</text>
      <rect x="900" y="40" width="200" height="40" rx="8" fill="none" stroke="${STROKE_COLOR}" />
      <text x="1000" y="65" font-family="Arial" font-size="12" text-anchor="middle" fill="${STROKE_COLOR}">View Details</text>
      
      <!-- Meeting 2 -->
      <rect x="0" y="140" width="1144" height="120" rx="16" fill="${BG_COLOR}" stroke="${STROKE_COLOR}" />
      <text x="24" y="180" font-family="Arial" font-size="16" font-weight="bold" fill="${STROKE_COLOR}">Design Review</text>
      <text x="24" y="205" font-family="Arial" font-size="12" fill="${STROKE_COLOR}">Feb 20, 2:00 PM - 3:00 PM</text>
      <text x="24" y="230" font-family="Arial" font-size="12" fill="${STROKE_COLOR}">Mobile App Redesign • 3 attendees</text>
      <rect x="900" y="180" width="200" height="40" rx="8" fill="none" stroke="${STROKE_COLOR}" />
      <text x="1000" y="205" font-family="Arial" font-size="12" text-anchor="middle" fill="${STROKE_COLOR}">View Details</text>
      
      <!-- Meeting 3 -->
      <rect x="0" y="280" width="1144" height="120" rx="16" fill="${BG_COLOR}" stroke="${STROKE_COLOR}" />
      <text x="24" y="320" font-family="Arial" font-size="16" font-weight="bold" fill="${STROKE_COLOR}">Daily Standup</text>
      <text x="24" y="345" font-family="Arial" font-size="12" fill="${STROKE_COLOR}">Today, 9:00 AM - 9:15 AM</text>
      <text x="24" y="370" font-family="Arial" font-size="12" fill="${STROKE_COLOR}">All Projects • 5 attendees</text>
      <rect x="900" y="320" width="200" height="40" rx="8" fill="none" stroke="${STROKE_COLOR}" />
      <text x="1000" y="345" font-family="Arial" font-size="12" text-anchor="middle" fill="${STROKE_COLOR}">View Details</text>
    </g>
  </g>
</svg>`;
  saveSVG(svg, "meetings.svg");
}

// 14. Halaman Meeting Detail
function generateMeetingDetailPage() {
  const svg = `
<svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${WIDTH}" height="${HEIGHT}" fill="${BG_COLOR}" />
  
  ${sidebar("/meetings")}
  ${header()}
  
  <!-- Konten Utama -->
  <g transform="translate(272, 112)">
    <text x="0" y="30" font-family="Arial" font-size="32" font-weight="bold" fill="${STROKE_COLOR}">Sprint Planning</text>
    
    <!-- Meeting Info -->
    <g transform="translate(0, 80)">
      <rect x="0" y="0" width="1144" height="600" rx="16" fill="${BG_COLOR}" stroke="${STROKE_COLOR}" />
      
      <!-- Left Column -->
      <g transform="translate(24, 40)">
        <text x="0" y="30" font-family="Arial" font-size="14" font-weight="bold" fill="${STROKE_COLOR}">Meeting Details</text>
        <text x="0" y="60" font-family="Arial" font-size="12" fill="${STROKE_COLOR}">Date: Tomorrow, February 15</text>
        <text x="0" y="85" font-family="Arial" font-size="12" fill="${STROKE_COLOR}">Time: 10:00 AM - 11:00 AM</text>
        <text x="0" y="110" font-family="Arial" font-size="12" fill="${STROKE_COLOR}">Project: Neural Network</text>
        <text x="0" y="135" font-family="Arial" font-size="12" fill="${STROKE_COLOR}">Attendees: 4 people</text>
        
        <text x="0" y="180" font-family="Arial" font-size="14" font-weight="bold" fill="${STROKE_COLOR}">Agenda</text>
        <rect x="0" y="200" width="500" height="32" rx="8" fill="none" stroke="${STROKE_COLOR}" />
        <text x="16" y="222" font-family="Arial" font-size="12" fill="${STROKE_COLOR}">1. Review previous sprint</text>
        <rect x="0" y="244" width="500" height="32" rx="8" fill="none" stroke="${STROKE_COLOR}" />
        <text x="16" y="266" font-family="Arial" font-size="12" fill="${STROKE_COLOR}">2. Plan next sprint tasks</text>
        <rect x="0" y="288" width="500" height="32" rx="8" fill="none" stroke="${STROKE_COLOR}" />
        <text x="16" y="310" font-family="Arial" font-size="12" fill="${STROKE_COLOR}">3. Assign responsibilities</text>
      </g>
      
      <!-- Right Column: AI Summary -->
      <g transform="translate(568, 40)">
        <text x="0" y="30" font-family="Arial" font-size="14" font-weight="bold" fill="${STROKE_COLOR}">AI Summary</text>
        <rect x="0" y="50" width="552" height="200" rx="8" fill="${BG_COLOR}" stroke="${STROKE_COLOR}" />
        <text x="16" y="80" font-family="Arial" font-size="12" fill="${STROKE_COLOR}">This meeting will focus on sprint planning for the Neural Network project. Key decisions will be made about task prioritization and team assignments.</text>
        
        <rect x="0" y="270" width="552" height="250" rx="8" fill="${BG_COLOR}" stroke="${STROKE_COLOR}" />
        <text x="16" y="300" font-family="Arial" font-size="14" font-weight="bold" fill="${STROKE_COLOR}">Record & Transcribe</text>
        <rect x="16" y="330" width="240" height="48" rx="8" fill="none" stroke="${STROKE_COLOR}" />
        <text x="136" y="360" font-family="Arial" font-size="14" font-weight="bold" fill="${STROKE_COLOR}" text-anchor="middle">Start Recording</text>
        <text x="16" y="410" font-family="Arial" font-size="12" fill="${STROKE_COLOR}">Auto-generate meeting notes with AI</text>
      </g>
    </g>
  </g>
</svg>`;
  saveSVG(svg, "meeting_detail.svg");
}

// 15. Halaman Admin Dashboard
function generateAdminDashboardPage() {
  const svg = `
<svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${WIDTH}" height="${HEIGHT}" fill="${BG_COLOR}" />
  
  ${sidebar("/admin")}
  ${header()}
  
  <!-- Konten Utama -->
  <g transform="translate(272, 112)">
    <text x="0" y="30" font-family="Arial" font-size="32" font-weight="bold" fill="${STROKE_COLOR}">Admin Dashboard</text>
    <text x="0" y="55" font-family="Arial" font-size="14" fill="${STROKE_COLOR}">Manage users, projects, and system settings</text>
    
    <!-- Stats -->
    <g transform="translate(0, 80)">
      <rect x="0" y="0" width="276" height="88" rx="16" fill="${BG_COLOR}" stroke="${STROKE_COLOR}" />
      <text x="24" y="44" font-family="Arial" font-size="12" fill="${STROKE_COLOR}">Total Users</text>
      <text x="24" y="70" font-family="Arial" font-size="24" font-weight="bold" fill="${STROKE_COLOR}">12</text>
      
      <rect x="296" y="0" width="276" height="88" rx="16" fill="${BG_COLOR}" stroke="${STROKE_COLOR}" />
      <text x="320" y="44" font-family="Arial" font-size="12" fill="${STROKE_COLOR}">Active Projects</text>
      <text x="320" y="70" font-family="Arial" font-size="24" font-weight="bold" fill="${STROKE_COLOR}">5</text>
      
      <rect x="592" y="0" width="276" height="88" rx="16" fill="${BG_COLOR}" stroke="${STROKE_COLOR}" />
      <text x="616" y="44" font-family="Arial" font-size="12" fill="${STROKE_COLOR}">Total Meetings</text>
      <text x="616" y="70" font-family="Arial" font-size="24" font-weight="bold" fill="${STROKE_COLOR}">24</text>
    </g>
    
    <!-- User Management -->
    <g transform="translate(0, 200)">
      <rect x="0" y="0" width="1144" height="400" rx="16" fill="${BG_COLOR}" stroke="${STROKE_COLOR}" />
      <text x="24" y="40" font-family="Arial" font-size="18" font-weight="bold" fill="${STROKE_COLOR}">User Management</text>
      <rect x="920" y="20" width="200" height="40" rx="8" fill="none" stroke="${STROKE_COLOR}" />
      <text x="1020" y="46" font-family="Arial" font-size="12" font-weight="bold" fill="${STROKE_COLOR}" text-anchor="middle">Invite User</text>
      
      <!-- User Table -->
      <g transform="translate(24, 60)">
        <rect x="0" y="0" width="1096" height="56" fill="${BG_COLOR}" stroke="${STROKE_COLOR}" />
        <text x="24" y="34" font-family="Arial" font-size="12" font-weight="bold" fill="${STROKE_COLOR}">NAME</text>
        <text x="350" y="34" font-family="Arial" font-size="12" font-weight="bold" fill="${STROKE_COLOR}">EMAIL</text>
        <text x="600" y="34" font-family="Arial" font-size="12" font-weight="bold" fill="${STROKE_COLOR}">ROLE</text>
        <text x="800" y="34" font-family="Arial" font-size="12" font-weight="bold" fill="${STROKE_COLOR}">STATUS</text>
        <text x="950" y="34" font-family="Arial" font-size="12" font-weight="bold" fill="${STROKE_COLOR}">ACTIONS</text>
        
        <!-- User 1 -->
        <rect x="0" y="56" width="1096" height="60" fill="${BG_COLOR}" stroke="${STROKE_COLOR}" />
        <circle cx="56" cy="86" r="20" fill="none" stroke="${STROKE_COLOR}" />
        <text x="92" y="76" font-family="Arial" font-size="12" font-weight="bold" fill="${STROKE_COLOR}">Alex Developer</text>
        <text x="350" y="76" font-family="Arial" font-size="12" fill="${STROKE_COLOR}">alex@example.com</text>
        <rect x="600" y="66" width="80" height="24" rx="12" fill="none" stroke="${STROKE_COLOR}" />
        <text x="640" y="82" font-family="Arial" font-size="10" text-anchor="middle" fill="${STROKE_COLOR}">Owner</text>
        <rect x="800" y="66" width="80" height="24" rx="12" fill="none" stroke="${STROKE_COLOR}" />
        <text x="840" y="82" font-family="Arial" font-size="10" text-anchor="middle" fill="${STROKE_COLOR}">Active</text>
        
        <!-- User 2 -->
        <rect x="0" y="116" width="1096" height="60" fill="${BG_COLOR}" stroke="${STROKE_COLOR}" />
        <circle cx="56" cy="146" r="20" fill="none" stroke="${STROKE_COLOR}" />
        <text x="92" y="136" font-family="Arial" font-size="12" font-weight="bold" fill="${STROKE_COLOR}">Sarah Designer</text>
        <text x="350" y="136" font-family="Arial" font-size="12" fill="${STROKE_COLOR}">sarah@example.com</text>
        <rect x="600" y="126" width="80" height="24" rx="12" fill="none" stroke="${STROKE_COLOR}" />
        <text x="640" y="142" font-family="Arial" font-size="10" text-anchor="middle" fill="${STROKE_COLOR}">Member</text>
        <rect x="800" y="126" width="80" height="24" rx="12" fill="none" stroke="${STROKE_COLOR}" />
        <text x="840" y="142" font-family="Arial" font-size="10" text-anchor="middle" fill="${STROKE_COLOR}">Active</text>
        
        <!-- User 3 -->
        <rect x="0" y="176" width="1096" height="60" fill="${BG_COLOR}" stroke="${STROKE_COLOR}" />
        <circle cx="56" cy="206" r="20" fill="none" stroke="${STROKE_COLOR}" />
        <text x="92" y="196" font-family="Arial" font-size="12" font-weight="bold" fill="${STROKE_COLOR}">Mike Engineer</text>
        <text x="350" y="196" font-family="Arial" font-size="12" fill="${STROKE_COLOR}">mike@example.com</text>
        <rect x="600" y="186" width="80" height="24" rx="12" fill="none" stroke="${STROKE_COLOR}" />
        <text x="640" y="202" font-family="Arial" font-size="10" text-anchor="middle" fill="${STROKE_COLOR}">Admin</text>
        <rect x="800" y="186" width="80" height="24" rx="12" fill="none" stroke="${STROKE_COLOR}" />
        <text x="840" y="202" font-family="Arial" font-size="10" text-anchor="middle" fill="${STROKE_COLOR}">Active</text>
      </g>
    </g>
  </g>
</svg>`;
  saveSVG(svg, "admin_dashboard.svg");
}

// Generate semua wireframe
console.log("Generating wireframes...");
generateLoginPage();
generateResetPasswordPage();
generateDashboardPage();
generateProjectsPage();
generateProjectDetailMilestonesPage();
generateProjectDetailTasksPage();
generateProjectDetailOverviewPage();
generateProjectDetailMembersPage();
generateProjectDetailActivityPage();
generateProjectDetailAiReportPage();
generateProjectDetailAiHealthPage();
generateProfilePage();
generateMeetingsPage();
generateMeetingDetailPage();
generateAdminDashboardPage();
console.log("All wireframes generated successfully!");
