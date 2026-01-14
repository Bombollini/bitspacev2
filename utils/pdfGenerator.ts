import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Project, Task, Member, Activity, User, Milestone } from '../types';
import logo from '../logo.png';

// Standard Colors
const COLOR_PRIMARY = [63, 81, 181]; // Indigo
const COLOR_TEXT = [50, 50, 50];
const COLOR_HEADER_BG = [220, 240, 255]; // Light Blue
const COLOR_HEADER_TEXT = [0, 0, 0];

const reportTableTheme = {
    theme: 'grid' as const,
    headStyles: { 
        fillColor: COLOR_HEADER_BG, 
        textColor: COLOR_HEADER_TEXT, 
        lineColor: [200, 200, 200], 
        lineWidth: 0.1,
        fontStyle: 'bold',
        halign: 'center' as const
    },
    bodyStyles: { 
        textColor: COLOR_TEXT, 
        lineColor: [200, 200, 200], 
        lineWidth: 0.1 
    },
    styles: { 
        fontSize: 10, 
        cellPadding: 4, 
        valign: 'middle' as const
    },
};

/**
 * Shared Header Generator
 */
const generateReportHeader = async (doc: jsPDF, reportTitle: string, project?: Project, metaText?: string) => {
    const companyName = "Bitora Protocol";
    const now = new Date();
    const dateStr = now.toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' }).replace('.', ':');
    
    // 1. Logo (Left)
    try {
        doc.addImage(logo, 'PNG', 14, 10, 15, 15);
    } catch (e) {
        console.warn('Logo could not be loaded', e);
    }

    // 2. Company Name (Next to Logo)
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0); // Black
    doc.text(companyName, 35, 20);

    // 3. Meta Info (Right)
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Tanggal Cetak: ${dateStr}`, 196, 15, { align: 'right' });
    if (metaText) {
        doc.text(metaText, 196, 20, { align: 'right' });
    }

    // 4. Report Title (Centered/Below)
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(reportTitle.toUpperCase(), 105, 35, { align: 'center' });

    // 5. Sub-header (Project Name)
    if (project) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(`Project: ${project.name}`, 14, 45);
    }

    // Separator
    doc.setLineWidth(0.5);
    doc.setDrawColor(200, 200, 200);
    doc.line(14, 48, 196, 48);

    return 55; // Return Y start position for content
};

const addFooter = (doc: jsPDF, finalY: number) => {
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text("Dicetak oleh sistem dashboard Bitora Protocol", 196, finalY + 10, { align: 'right' });
}

export const savePDF = (doc: jsPDF, filename: string) => {
  doc.save(`${filename}.pdf`);
};

// --- Report Generators ---

export const generateProjectSummaryPDF = async (project: Project, members: User[]) => {
  const doc = new jsPDF();
  const startY = await generateReportHeader(doc, 'Project Status Summary', project);

  // Project Info
  doc.setFontSize(12);
  doc.setTextColor(0,0,0);
  doc.text(`Status: ${project.status}`, 14, startY + 7);
  doc.text(`Description: ${project.description || 'N/A'}`, 14, startY + 14);

  // Stats
  const total = project.stats?.totalTasks || 0;
  const completed = project.stats?.completedTasks || 0;
  const overdue = project.stats?.overdueTasks || 0;
  
  doc.text('Statistics:', 14, startY + 25);
  doc.text(`- Total Tasks: ${total}`, 20, startY + 32);
  doc.text(`- Completed: ${completed}`, 20, startY + 39);
  doc.text(`- Overdue: ${overdue}`, 20, startY + 46);

  // Members Table
  const memberRows = members.map(m => ([
      m.name || 'Unknown', 
      m.email || 'N/A', 
      m.role
  ]));

  autoTable(doc, {
    startY: startY + 55,
    head: [['Name', 'Email', 'Role']],
    body: memberRows,
    ...reportTableTheme
  });

  addFooter(doc, (doc as any).lastAutoTable.finalY);
  savePDF(doc, `Project_Summary_${project.name}`);
};

export const generateTaskListPDF = async (tasks: Task[], project: Project, users: User[]) => {
    const doc = new jsPDF();
    const startY = await generateReportHeader(doc, 'Task List Report', project, `Total Tasks: ${tasks.length}`);

    const rows = tasks.map(t => {
        const assignee = users.find(u => u.id === t.assigneeId)?.name || 'Unassigned';
        return [
            t.title,
            t.status,
            t.priority,
            assignee,
            t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '-'
        ];
    });

    autoTable(doc, {
        startY: startY,
        head: [['Title', 'Status', 'Priority', 'Assignee', 'Due Date']],
        body: rows,
        ...reportTableTheme
    });

    addFooter(doc, (doc as any).lastAutoTable.finalY);
    savePDF(doc, `Task_List_${project.name}`);
};

export const generateMemberWorkloadPDF = async (project: Project, members: User[], tasks: Task[]) => {
    const doc = new jsPDF();
    const startY = await generateReportHeader(doc, 'Member Workload Report', project);

    const rows = members.map(m => {
        const userTasks = tasks.filter(t => t.assigneeId === m.id);
        const active = userTasks.filter(t => t.status !== 'DONE').length;
        const completed = userTasks.filter(t => t.status === 'DONE').length;
        return [
            m.name || 'Unknown',
            active,
            completed,
            userTasks.length
        ];
    });

    autoTable(doc, {
        startY: startY,
        head: [['Member', 'Active Tasks', 'Completed', 'Total']],
        body: rows,
        ...reportTableTheme
    });

    addFooter(doc, (doc as any).lastAutoTable.finalY);
    savePDF(doc, `Workload_${project.name}`);
};

export const generateAllProjectsReportPDF = async (data: { project: Project, members: User[] }[]) => {
    const doc = new jsPDF();
    const startY = await generateReportHeader(doc, 'All Projects Report', undefined, `Total Projects: ${data.length}`);

    let currentY = startY;

    data.forEach((item, index) => {
        if (currentY > 250) {
            doc.addPage();
            currentY = 20;
        }

        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'bold');
        doc.text(`${item.project.name}`, 14, currentY);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Status: ${item.project.status}`, 14, currentY + 5);
        doc.text(`Description: ${item.project.description || 'No description'}`, 14, currentY + 10);
        
        const memberNames = item.members.map(m => `${m.name} (${m.role})`).join(', ');
        const splitMembers = doc.splitTextToSize(`Members: ${memberNames}`, 180);
        
        doc.setTextColor(80, 80, 80);
        doc.text(splitMembers, 14, currentY + 16);
        
        const memberHeight = splitMembers.length * 4;
        currentY = currentY + 20 + memberHeight;
        
        doc.setDrawColor(200, 200, 200);
        doc.line(14, currentY, 196, currentY);
        currentY += 10;
    });

    addFooter(doc, currentY);
    savePDF(doc, `All_Projects_Report_${new Date().toISOString().split('T')[0]}`);
};

export const generateActivityLogPDF = async (project: Project, activities: Activity[]) => {
    const doc = new jsPDF();
    const startY = await generateReportHeader(doc, 'Project Activity Log', project);

    const recentActivities = activities.slice(0, 100); 

    const rows = recentActivities.map(a => {
        return [
            new Date(a.createdAt).toLocaleString(),
            a.user?.name || 'By System',
            a.action,
            `${a.targetType}: ${a.metadata?.title || a.targetId}`
        ];
    });

    autoTable(doc, {
        startY: startY,
        head: [['Time', 'User', 'Action', 'Details']],
        body: rows,
        ...reportTableTheme,
        columnStyles: { 3: { cellWidth: 80 } }
    });

    addFooter(doc, (doc as any).lastAutoTable.finalY);
    savePDF(doc, `Activity_Log_${project.name}`);
};

export const generateMilestoneReportPDF = async (project: Project, milestones: Milestone[]) => {
    const doc = new jsPDF();
    const startY = await generateReportHeader(doc, 'Laporan Progress Milestone', project, `Total Milestone: ${milestones.length}`);

    const rows = milestones.map((m, index) => {
        return [
            index + 1,
            m.title,
            m.description || '-',
            m.status,
            m.dueDate ? new Date(m.dueDate).toLocaleDateString('id-ID') : '-',
            `${m.progress || 0}%`
        ];
    });

    autoTable(doc, {
        startY: startY,
        head: [['NO', 'MILESTONE', 'DESCRIPTION', 'STATUS', 'DUE DATE', 'PROGRESS']],
        body: rows,
        ...reportTableTheme,
        columnStyles: {
            0: { cellWidth: 15, halign: 'center' }, // NO - Widened
            1: { cellWidth: 40 }, // Title
            2: { cellWidth: 'auto' }, // Desc
            3: { cellWidth: 30 }, // Status - Widened
            4: { cellWidth: 35 }, // Due Date - Widened
            5: { cellWidth: 30, halign: 'center' } // Progress - Widened
        }
    });

    addFooter(doc, (doc as any).lastAutoTable.finalY);
    savePDF(doc, `Laporan_Milestone_${project.name}_${new Date().getTime()}`);
};
