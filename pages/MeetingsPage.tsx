import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/apiClient";
import { Project, Meeting } from "../types";
import { useAuth } from "../services/authStore";
import { Layout } from "../components/Layout";
import { Calendar, ChevronRight, Plus, Video, CalendarDays } from "lucide-react";
import { NewMeetingModal } from "../components/NewMeetingModal";

export const MeetingsPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const didInitialFetch = useRef(false);

  useEffect(() => {
    if (didInitialFetch.current) return;
    didInitialFetch.current = true;
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const projectsData = await api.projects.list();
      setProjects(projectsData);
      const meetingsData = await api.meetings.list();
      setMeetings(meetingsData);
    } catch (err: any) {
      console.error("Fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateMeeting = async (data: any) => {
    try {
      const newMeeting = await api.meetings.create(data);
      setMeetings([newMeeting, ...meetings]);

      // Silently send email to all project members in the background
      api.projects.members(data.projectId).then(async (members) => {
        const project = projects.find(p => p.id === data.projectId);
        const projectName = project ? project.name : 'Unknown Project';
        const subject = `Meeting Invitation: ${data.title} - ${projectName}`;

        const emailPromises = members.map(member => {
          if (!member.email) return Promise.resolve();

          const htmlBody = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6;">
              <div style="text-align: center; margin-bottom: 20px;">
                <h2 style="color: #bc13fe; border-bottom: 2px solid #eee; padding-bottom: 10px; display: inline-block;">${projectName}</h2>
              </div>
              
              <p>Hello <strong>${member.name}</strong>,</p>
              <p>You have been invited to a new meeting for the project. Please find the details below:</p>
              
              <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #bc13fe;">
                <h3 style="margin-top: 0; margin-bottom: 15px; color: #333;">${data.title}</h3>
                <p style="margin: 5px 0;"><strong>Date & Time:</strong> ${new Date(data.meetingDate).toLocaleString()}</p>
                <p style="margin: 5px 0;"><strong>Meeting Link:</strong> ${data.meetingLink ? `<a href="${data.meetingLink}" style="color: #bc13fe; font-weight: bold; text-decoration: none;">Join Meeting Here</a>` : 'N/A'}</p>
              </div>
              
              <p>Please make sure to attend on time. If you cannot make it, please reply to this email or confirm in the project group.</p>
              <p style="margin-top: 30px; font-size: 14px; color: #888;">
                Best regards,<br/>
                <strong>Bitspace Protocol Platform</strong>
              </p>
            </div>
          `;

          return api.meetings.sendEmail({
            to: [member.email],
            subject,
            html: htmlBody,
          });
        });

        await Promise.all(emailPromises);
      }).catch(err => {
        console.error("Failed to send background emails", err);
      });

    } catch (err) {
      console.error("Failed to create meeting", err);
      alert("Failed to create meeting");
    }
  };

  const getProjectName = (projectId: string) => {
    const p = projects.find((p) => p.id === projectId);
    return p ? p.name : "Unknown Project";
  };

  return (
    <Layout>
      <div className="space-y-8 animate-fade-in">
        <div className="flex flex-col gap-1">
          <h2 className="text-3xl font-display font-bold text-white tracking-tight drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">Meetings</h2>
          <p className="text-slate-400 max-w-2xl">Manage your project meetings, agendas, and retrospectives.</p>
        </div>

        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-white font-display flex items-center gap-2">
            <span className="w-1 h-6 bg-neon-purple rounded-full shadow-[0_0_10px_#bc13fe]"></span>
            Scheduled Meetings
          </h3>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-neon-purple/20 text-neon-purple border border-neon-purple/50 rounded-lg hover:bg-neon-purple/30 hover:shadow-[0_0_15px_rgba(188,19,254,0.4)] transition-all text-sm font-medium group"
            >
              <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" /> Schedule Meeting
            </button>
          </div>
        </div>

        <NewMeetingModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onSubmit={handleCreateMeeting}
          projects={projects}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            [0, 1, 2].map((i) => <div key={i} className="h-48 glass-panel animate-pulse rounded-2xl bg-white/5"></div>)
          ) : meetings.length === 0 ? (
            <div className="col-span-full py-16 text-center glass-panel rounded-3xl border border-dashed border-white/10">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="text-slate-500" size={32} />
              </div>
              <p className="text-slate-400 text-lg">No meetings scheduled.</p>
              <p className="text-slate-600 text-sm mt-2">Initialize a new meeting to begin.</p>
            </div>
          ) : (
            meetings.map((meeting, index) => {
              const dateObj = new Date(meeting.meetingDate);
              const formattedDate = dateObj.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
              const formattedTime = dateObj.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

              return (
                <Link
                  key={meeting.id}
                  to={`/meetings/${meeting.id}`}
                  className="glass-panel p-6 rounded-2xl group hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(188,19,254,0.15)] transition-all duration-300 border-t-2 border-t-transparent hover:border-t-neon-purple relative overflow-hidden flex flex-col h-full"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="text-xs font-semibold text-neon-purple uppercase tracking-wider mb-1 opacity-80">{getProjectName(meeting.projectId)}</div>
                      <h4 className="text-lg font-bold text-white font-display tracking-tight truncate group-hover:text-neon-purple transition-colors">{meeting.title}</h4>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-neon-purple/50 transition-colors">
                        <Video size={18} className="text-slate-400 group-hover:text-neon-purple transition-colors" />
                    </div>
                  </div>

                  <div className="mt-auto space-y-3 pt-2">
                    <div className="flex items-center gap-3 text-sm text-slate-300 bg-black/20 p-3 rounded-xl border border-white/5">
                        <CalendarDays size={16} className="text-neon-purple opacity-70" />
                        <span>{formattedDate} &middot; {formattedTime}</span>
                    </div>
                    {meeting.retrospective ? (
                        <div className="text-xs text-emerald-400 font-medium flex items-center gap-1 opacity-80">
                           <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span> Retrospective Saved
                        </div>
                    ) : (
                        <div className="text-xs text-slate-500 font-medium flex items-center gap-1">
                           <span className="w-1.5 h-1.5 bg-slate-500 rounded-full"></span> Waiting for Retrospective
                        </div>
                    )}
                  </div>
                  
                  <div className="absolute top-1/2 right-4 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                      <ChevronRight className="text-neon-purple" size={20} />
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </Layout>
  );
};
