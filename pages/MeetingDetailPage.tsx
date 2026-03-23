import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../services/apiClient";
import { Meeting, Project, User } from "../types";
import { Layout } from "../components/Layout";
import { ArrowLeft, Calendar, Video, FileText, CheckCircle2 } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const MeetingDetailPage: React.FC = () => {
  const { meetingId } = useParams<{ meetingId: string }>();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [retrospective, setRetrospective] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

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

  const handleSaveRetro = async () => {
    if (!meeting) return;
    setIsSaving(true);
    try {
      const updated = await api.meetings.update(meeting.id, { retrospective });
      setMeeting(updated);
      alert("Retrospective saved successfully.");
    } catch (err) {
      console.error("Failed to save retrospective", err);
      alert("Failed to save.");
    } finally {
      setIsSaving(false);
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
      <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
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
                </div>
            </div>
        </div>

        <div className="glass-panel p-8 rounded-2xl border border-white/5">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-neon-purple/20 border border-neon-purple/50 flex items-center justify-center">
                    <CheckCircle2 className="text-neon-purple" size={20} />
                </div>
                <h3 className="text-xl font-bold text-white font-display tracking-tight">Retrospective & Notes</h3>
            </div>
            
            <textarea
                value={retrospective}
                onChange={(e) => setRetrospective(e.target.value)}
                placeholder="Document key decisions, action items, and discussion points from the meeting..."
                className="w-full h-64 bg-black/40 border border-white/10 rounded-xl p-6 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-neon-purple focus:ring-1 focus:ring-neon-purple transition-all resize-none shadow-inner"
            />
            
            <div className="flex justify-end mt-4">
                <button 
                    onClick={handleSaveRetro}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-8 py-3 bg-neon-purple text-white shadow-[0_0_15px_rgba(188,19,254,0.4)] hover:shadow-[0_0_25px_rgba(188,19,254,0.6)] rounded-xl hover:bg-neon-purple/80 transition-all font-bold disabled:opacity-50"
                >
                    {isSaving ? "Saving Database..." : "Save Retrospective"}
                </button>
            </div>
        </div>
      </div>
    </Layout>
  );
};
