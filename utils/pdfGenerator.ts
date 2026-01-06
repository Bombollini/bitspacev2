import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Project, Task, Member, Activity, User } from '../types';

export const generatePDF = (title: string): jsPDF => {
  const doc = new jsPDF();
  
  // Set metadata
  doc.setProperties({
    title: title,
    author: 'Bitspace v2',
  });

  // Add Header
  doc.setFontSize(20);
  doc.text('Bitspace Report', 14, 22);
  
  doc.setFontSize(14);
  doc.text(title, 14, 32);
  
  doc.setFontSize(10);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 40);
  
  doc.setLineWidth(0.5);
  doc.line(14, 45, 196, 45); // Horizontal line

  return doc;
};

export const savePDF = (doc: jsPDF, filename: string) => {
  doc.save(`${filename}.pdf`);
};

// --- Report Specific Generators ---

// --- Report Specific Generators ---

export const generateProjectSummaryPDF = (project: Project, members: User[]) => {
  const doc = generatePDF('Project Status Summary');
  
  // Project Info
  doc.setFontSize(12);
  doc.text(`Project Name: ${project.name}`, 14, 55);
  doc.text(`Status: ${project.status}`, 14, 62);
  doc.text(`Description: ${project.description || 'N/A'}`, 14, 69);

  // Stats
  const total = project.stats?.totalTasks || 0;
  const completed = project.stats?.completedTasks || 0;
  const overdue = project.stats?.overdueTasks || 0;
  
  doc.text('Statistics:', 14, 80);
  doc.text(`- Total Tasks: ${total}`, 20, 87);
  doc.text(`- Completed: ${completed}`, 20, 94);
  doc.text(`- Overdue: ${overdue}`, 20, 101);

  // Members Table
  const memberRows = members.map(m => {
    return [
        m.name || 'Unknown', 
        m.email || 'N/A', 
        m.role
    ];
  });

  autoTable(doc, {
    startY: 110,
    head: [['Name', 'Email', 'Role']],
    body: memberRows,
    theme: 'striped',
    headStyles: { fillColor: [63, 81, 181] }
  });

  savePDF(doc, `Project_Summary_${project.name}`);
};

export const generateTaskListPDF = (tasks: Task[], project: Project, users: User[]) => {
    const doc = generatePDF('Task List Report');

    doc.text(`Project: ${project.name}`, 14, 55);

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
        startY: 65,
        head: [['Title', 'Status', 'Priority', 'Assignee', 'Due Date']],
        body: rows,
        headStyles: { fillColor: [41, 128, 185] } // Different color for distinction
    });

    savePDF(doc, `Task_List_${project.name}`);
};

export const generateMemberWorkloadPDF = (project: Project, members: User[], tasks: Task[]) => {
    const doc = generatePDF('Member Workload Report');
    doc.text(`Project: ${project.name}`, 14, 55);

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
        startY: 65,
        head: [['Member', 'Active Tasks', 'Completed', 'Total']],
        body: rows,
        headStyles: { fillColor: [76, 175, 80] }
    });

    savePDF(doc, `Workload_${project.name}`);
};

export const generateOverdueReportPDF = (project: Project, tasks: Task[], users: User[]) => {
    const doc = generatePDF('Overdue Tasks Report');
    doc.setTextColor(220, 53, 69);
    doc.text(`URGENT: Overdue Items for ${project.name}`, 14, 55);
    doc.setTextColor(0, 0, 0);

    const now = new Date();
    const overdueTasks = tasks.filter(t => {
        if (!t.dueDate || t.status === 'DONE') return false;
        return new Date(t.dueDate) < now;
    });

    if (overdueTasks.length === 0) {
        doc.text('No overdue tasks found. Good job!', 14, 70);
    } else {
        const rows = overdueTasks.map(t => {
            const assignee = users.find(u => u.id === t.assigneeId)?.name || 'Unassigned';
            return [
                t.title,
                assignee,
                t.status,
                new Date(t.dueDate!).toLocaleDateString()
            ];
        });

        autoTable(doc, {
            startY: 65,
            head: [['Title', 'Assignee', 'Status', 'Due Date']],
            body: rows,
            headStyles: { fillColor: [200, 35, 51] }
        });
    }

    savePDF(doc, `Overdue_${project.name}`);
};

export const generateActivityLogPDF = (project: Project, activities: Activity[]) => {
    const doc = generatePDF('Project Activity Log');
    doc.text(`Project: ${project.name}`, 14, 55);

    // Limit to last 50 activities to fit reasonably, or paginate
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
        startY: 65,
        head: [['Time', 'User', 'Action', 'Details']],
        body: rows,
        headStyles: { fillColor: [156, 39, 176] }
    });

    savePDF(doc, `Activity_Log_${project.name}`);
};

