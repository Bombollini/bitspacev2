import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../services/apiClient";
import { AIService } from "../services/ai.service";
import { Meeting, Project, User, TaskPriority, TaskStatus } from "../types";
import { Layout } from "../components/Layout";
import { ArrowLeft, Calendar, Video, FileText, CheckCircle2, Sparkles, AlertTriangle, PlusCircle, Check } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const MeetingDetailPage: React.FC = () => {
  const { meetingId } = useParams<{ meetingId: string }>();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  
  const [retrospective, setRetrospective] = useState("");
  const [meetingNotes, setMeetingNotes] = useState("");
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  
  const [createdActionItems, setCreatedActionItems] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchMeetingData();
  }, [meetingId]);

  const fetchMeetingData = async () => {
    if (!meetingId) return;
    setIsLoading(true);
    try {
      const data = await api.meetings.get(meetingId);
      setMeeting(data);
      setRetrospective(data.retrospective || "");
      setMeetingNotes(data.meetingNotes || "");

      const pData = await api.projects.get(data.projectId);
      setProject(pData);

      const mData = await api.projects.members(data.projectId);
      setMembers(mData);
    } catch (err) {
      console.error("Failed to fetch meeting", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveData = async () => {
    if (!meeting) return;
    setIsSaving(true);
    try {
      const updated = await api.meetings.update(meeting.id, { 
          retrospective,
          meetingNotes
      });
      setMeeting(updated);
      alert("Changes saved successfully.");
    } catch (err) {
      console.error("Failed to save", err);
      alert("Failed to save.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSummarizeMeeting = async () => {
    if (!meeting || !meetingNotes.trim()) {
        alert("Please enter meeting notes first.");
        return;
    }
    
    setIsSummarizing(true);
    try {
      const simpleMembers = members.map(m => ({ id: m.id, name: m.name, role: m.role }));
      const summaryResult = await AIService.summarizeMeeting(meetingNotes, simpleMembers);
      
      const updated = await api.meetings.update(meeting.id, {
          meetingSummary: summaryResult,
          meetingNotes: meetingNotes
      });
      setMeeting(updated);
      
    } catch (err: any) {
        console.error(err);
        alert("Failed to summarize meeting: " + err.message);
    } finally {
        setIsSummarizing(false);
    }
  };

  const handleCreateTask = async (itemIndex: number, actionItem: any) => {
    if (!meeting) return;
    try {
        await api.tasks.create({
            projectId: meeting.projectId,
            title: actionItem.taskTitle,
            description: actionItem.description,
            assigneeId: actionItem.suggestedAssigneeId || undefined,
            status: TaskStatus.TODO,
            priority: TaskPriority.MEDIUM
        });
        
        setCreatedActionItems(prev => new Set(prev).add(itemIndex));
    } catch (err) {
        console.error("Failed to create task", err);
        alert("Failed to create task");
    }
  };

  const handleExportPDF = () => {
    if (!meeting || !project) return;
    const doc = new jsPDF() as any;

    doc.setFillColor(15, 16, 32); 
    doc.rect(0, 0, doc.internal.pageSize.width, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text(`Meeting Report: ${meeting.title}`, 14, 20);

    doc.setTextColor(40, 40, 40);
    doc.setFontSize(11);
    
    autoTable(doc, {
      startY: 40,
      head: [['Property', 'Details']],
      body: [
        ['Project', project.name],
        ['Meeting Title', meeting.title],
        ['Date', new Date(meeting.meetingDate).toLocaleString()],
        ['Link', meeting.meetingLink || 'None provided']
      ],
      theme: 'grid',
      headStyles: { fillColor: [188, 19, 254], textColor: 255 },
      styles: { fontSize: 10, cellPadding: 5 }
    });

    const finalY = (doc as any).lastAutoTable?.finalY || 100;
    
    doc.setFontSize(12);
    doc.setTextColor(188, 19, 254);
    doc.text("Retrospective / Notes", 14, finalY + 15);
    
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(10);
    const splitText = doc.splitTextToSize(retrospective || 'No retrospective written yet.', 180);
    doc.text(splitText, 14, finalY + 22);

    doc.save(`Meeting_${meeting.title.replace(/\s+/g, '_')}.pdf`);
  };

  if (isLoading || !meeting || !project) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="w-10 h-10 border-4 border-neon-purple border-t-transparent rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }

  const dateObj = new Date(meeting.meetingDate);
  const formattedDate = dateObj.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const formattedTime = dateObj.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
        <button 
          onClick={() => navigate('/meetings')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group text-sm font-medium"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 
          Back to Meetings
        </button>

        <div className="glass-panel p-8 rounded-2xl relative overflow-hidden border border-neon-purple/20">
            <div className="absolute top-0 right-0 w-64 h-64 bg-neon-purple/10 rounded-full blur-[100px] pointer-events-none"></div>
            
            <div className="flex flex-col md:flex-row justify-between items-start gap-6 relative z-10">
                <div className="flex-1">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neon-purple/10 border border-neon-purple/30 text-neon-purple text-xs font-bold uppercase tracking-widest mb-4">
                        {project.name}
                    </div>
                    <h1 className="text-3xl font-display font-bold text-white tracking-tight mb-2 drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
                        {meeting.title}
                    </h1>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-slate-300 mt-6">
                        <div className="flex items-center gap-2 bg-black/30 px-4 py-2 rounded-xl border border-white/5">
                            <Calendar className="text-neon-purple" size={18} />
                            {formattedDate} at {formattedTime}
                        </div>
                        {meeting.meetingLink && (
                            <a href={meeting.meetingLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-colors">
                                <Video size={18} /> Join Meeting
                            </a>
                        )}
                    </div>
                </div>

                <div className="flex flex-col gap-3 w-full md:w-auto">
                    <button 
                        onClick={handleExportPDF}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-white/5 text-slate-200 border border-white/10 rounded-xl hover:bg-white/10 transition-all font-medium text-sm"
                    >
                        <FileText size={18} /> Export to PDF
                    </button>
                    <button 
                        onClick={handleSaveData}
                        disabled={isSaving}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-neon-purple text-white shadow-[0_0_15px_rgba(188,19,254,0.4)] hover:shadow-[0_0_25px_rgba(188,19,254,0.6)] rounded-xl hover:bg-neon-purple/80 transition-all font-bold disabled:opacity-50 text-sm"
                    >
                        {isSaving ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: Input Notes & Retrospective */}
            <div className="space-y-6">
                <div className="glass-panel p-6 rounded-2xl border border-white/5">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-neon-purple/20 border border-neon-purple/50 flex items-center justify-center">
                                <FileText className="text-neon-purple" size={16} />
                            </div>
                            <h3 className="text-lg font-bold text-white font-display tracking-tight">Raw Meeting Notes</h3>
                        </div>
                        <button 
                            onClick={handleSummarizeMeeting}
                            disabled={isSummarizing || !meetingNotes.trim()}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-neon-purple to-neon-pink text-white rounded-lg hover:shadow-[0_0_15px_rgba(188,19,254,0.4)] transition-all font-bold disabled:opacity-50 text-xs uppercase tracking-wider"
                        >
                            {isSummarizing ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Sparkles size={14} />}
                            {isSummarizing ? "Summarizing..." : "Summarize Meeting"}
                        </button>
                    </div>
                    
                    <textarea
                        value={meetingNotes}
                        onChange={(e) => setMeetingNotes(e.target.value)}
                        placeholder="Paste raw transcript, chat logs, or free-form notes here..."
                        className="w-full h-64 bg-black/40 border border-white/10 rounded-xl p-4 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-neon-purple focus:ring-1 focus:ring-neon-purple transition-all resize-none shadow-inner text-sm"
                    />
                </div>

                <div className="glass-panel p-6 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/50 flex items-center justify-center">
                            <CheckCircle2 className="text-blue-400" size={16} />
                        </div>
                        <h3 className="text-lg font-bold text-white font-display tracking-tight">Manual Retrospective</h3>
                    </div>
                    
                    <textarea
                        value={retrospective}
                        onChange={(e) => setRetrospective(e.target.value)}
                        placeholder="Document any additional retrospective points manually..."
                        className="w-full h-32 bg-black/40 border border-white/10 rounded-xl p-4 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none shadow-inner text-sm"
                    />
                </div>
            </div>

            {/* Right Column: AI Output */}
            <div className="space-y-6">
                {meeting.meetingSummary ? (
                    <div className="glass-panel p-6 rounded-2xl border border-neon-purple/30 bg-neon-purple/5 shadow-[0_0_30px_rgba(188,19,254,0.1)] h-full animate-fade-in">
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
                            <Sparkles className="text-neon-pink" size={24} />
                            <h3 className="text-xl font-bold text-white font-display tracking-tight">AI Summary</h3>
                        </div>

                        <div className="mb-6">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Overview</h4>
                            <p className="text-slate-200 text-sm leading-relaxed">{meeting.meetingSummary.summary}</p>
                        </div>

                        {meeting.meetingSummary.keyDecisions && meeting.meetingSummary.keyDecisions.length > 0 && (
                            <div className="mb-6">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Key Decisions</h4>
                                <ul className="space-y-2">
                                    {meeting.meetingSummary.keyDecisions.map((decision, i) => (
                                        <li key={i} className="flex items-start gap-2 bg-black/20 p-3 rounded-lg border border-white/5">
                                            <AlertTriangle size={14} className="text-amber-400 mt-0.5 flex-shrink-0" />
                                            <span className="text-sm text-slate-300">{decision}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {meeting.meetingSummary.actionItems && meeting.meetingSummary.actionItems.length > 0 && (
                            <div>
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Action Items</h4>
                                <div className="space-y-3">
                                    {meeting.meetingSummary.actionItems.map((item, i) => {
                                        const assignee = members.find(m => m.id === item.suggestedAssigneeId);
                                        const isCreated = createdActionItems.has(i);
                                        
                                        return (
                                            <div key={i} className="bg-black/30 p-4 rounded-xl border border-white/10 hover:border-neon-purple/30 transition-colors">
                                                <div className="flex justify-between items-start gap-4 mb-2">
                                                    <h5 className="font-bold text-white text-sm">{item.taskTitle}</h5>
                                                    <button 
                                                        onClick={() => handleCreateTask(i, item)}
                                                        disabled={isCreated}
                                                        className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                                            isCreated 
                                                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                                                                : "bg-neon-blue/10 text-neon-blue hover:bg-neon-blue/20 border border-neon-blue/30"
                                                        }`}
                                                    >
                                                        {isCreated ? <><Check size={12} /> Created</> : <><PlusCircle size={12} /> Create Task</>}
                                                    </button>
                                                </div>
                                                <p className="text-xs text-slate-400 mb-3">{item.description}</p>
                                                {assignee ? (
                                                    <div className="flex items-center gap-2">
                                                        {assignee.avatarUrl ? (
                                                            <img src={assignee.avatarUrl} alt={assignee.name} className="w-5 h-5 rounded-full object-cover" />
                                                        ) : (
                                                            <div className="w-5 h-5 rounded-full bg-neon-purple/20 flex items-center justify-center text-[10px] font-bold text-neon-purple">
                                                                {assignee.name.charAt(0)}
                                                            </div>
                                                        )}
                                                        <span className="text-xs font-medium text-slate-300">Suggested: {assignee.name}</span>
                                                    </div>
                                                ) : (
                                                    <div className="text-xs font-medium text-slate-500 italic">No assignee suggested</div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="glass-panel p-8 rounded-2xl border border-dashed border-white/20 flex flex-col items-center justify-center text-center h-full min-h-[400px]">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                            <Sparkles className="text-slate-500" size={28} />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">No AI Summary Yet</h3>
                        <p className="text-slate-400 text-sm max-w-sm">
                            Paste your meeting notes on the left and click "Summarize Meeting" to automatically extract key decisions and generate assignable tasks.
                        </p>
                    </div>
                )}
            </div>
        </div>
      </div>
    </Layout>
  );
};
