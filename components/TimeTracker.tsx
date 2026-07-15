import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, Plus, Trash2, Clock, Timer } from 'lucide-react';

interface TimeEntry {
  id: string;
  taskId: string;
  startTime: string;
  endTime?: string;
  description?: string;
  duration?: number;
}

interface TimeTrackerProps {
  taskId: string;
  taskTitle: string;
}

export const TimeTracker: React.FC<TimeTrackerProps> = ({ taskId, taskTitle }) => {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentStartTime, setCurrentStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [description, setDescription] = useState('');

  // Load saved time entries from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`timeEntries-${taskId}`);
    if (saved) {
      setTimeEntries(JSON.parse(saved));
    }
  }, [taskId]);

  // Timer for running entry
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && currentStartTime) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - currentStartTime.getTime()) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, currentStartTime]);

  // Format time from seconds
  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate total time
  const calculateTotalTime = (): number => {
    return timeEntries.reduce((total, entry) => {
      if (entry.endTime && entry.startTime) {
        return total + (new Date(entry.endTime).getTime() - new Date(entry.startTime).getTime()) / 1000;
      }
      return total;
    }, 0);
  };

  // Start timer
  const startTimer = () => {
    setCurrentStartTime(new Date());
    setIsRunning(true);
    setElapsedTime(0);
  };

  // Stop timer
  const stopTimer = () => {
    if (currentStartTime) {
      const newEntry: TimeEntry = {
        id: Date.now().toString(),
        taskId,
        startTime: currentStartTime.toISOString(),
        endTime: new Date().toISOString(),
        description: description || undefined,
        duration: Math.floor((Date.now() - currentStartTime.getTime()) / 1000),
      };
      
      const updatedEntries = [newEntry, ...timeEntries];
      setTimeEntries(updatedEntries);
      localStorage.setItem(`timeEntries-${taskId}`, JSON.stringify(updatedEntries));
      
      setIsRunning(false);
      setCurrentStartTime(null);
      setElapsedTime(0);
      setDescription('');
    }
  };

  // Delete time entry
  const deleteEntry = (id: string) => {
    const updatedEntries = timeEntries.filter(e => e.id !== id);
    setTimeEntries(updatedEntries);
    localStorage.setItem(`timeEntries-${taskId}`, JSON.stringify(updatedEntries));
  };

  const totalSeconds = calculateTotalTime();
  const totalHours = Math.floor(totalSeconds / 3600);
  const totalMinutes = Math.floor((totalSeconds % 3600) / 60);

  return (
    <div className="glass-panel rounded-2xl p-6 border border-white/10">
      <div className="flex items-center gap-3 mb-6">
        <Timer className="text-neon-blue" size={24} />
        <h3 className="text-xl font-bold text-white font-display">Time Tracking</h3>
      </div>

      {/* Current Timer */}
      <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-slate-400 mb-1">Timer Aktif</p>
            <div className="text-4xl font-mono font-bold text-neon-blue">
              {isRunning ? formatTime(elapsedTime) : '00:00:00'}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isRunning ? (
              <button
                onClick={startTimer}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 rounded-lg hover:bg-emerald-500/30 transition-colors font-semibold"
              >
                <Play size={18} fill="currentColor" />
                Mulai
              </button>
            ) : (
              <button
                onClick={stopTimer}
                className="flex items-center gap-2 px-4 py-2 bg-rose-500/20 text-rose-400 border border-rose-500/50 rounded-lg hover:bg-rose-500/30 transition-colors font-semibold"
              >
                <Square size={18} fill="currentColor" />
                Berhenti
              </button>
            )}
          </div>
        </div>
        {isRunning && (
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Deskripsi pekerjaan..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-white placeholder-slate-600 text-sm focus:outline-none focus:ring-1 focus:ring-neon-blue"
            />
          </div>
        )}
      </div>

      {/* Total Time */}
      <div className="mb-6 p-4 bg-neon-blue/5 rounded-xl border border-neon-blue/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="text-neon-blue" size={20} />
            <span className="text-slate-400">Total Waktu</span>
          </div>
          <span className="text-2xl font-bold text-neon-blue">
            {totalHours}j {totalMinutes}m
          </span>
        </div>
      </div>

      {/* Time Entries */}
      <div>
        <h4 className="text-sm font-semibold text-slate-400 mb-3">Riwayat Pekerjaan</h4>
        <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
          {timeEntries.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-4">
              Belum ada riwayat waktu
            </p>
          ) : (
            timeEntries.map((entry) => {
              const duration = entry.duration || 
                (entry.endTime ? (new Date(entry.endTime).getTime() - new Date(entry.startTime).getTime()) / 1000 : 0);
              const durHrs = Math.floor(duration / 3600);
              const durMins = Math.floor((duration % 3600) / 60);
              
              return (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-white">
                        {durHrs > 0 ? `${durHrs}j ` : ''}{durMins}m
                      </span>
                      <span className="text-xs text-slate-500">
                        {new Date(entry.startTime).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    {entry.description && (
                      <p className="text-xs text-slate-400 truncate">{entry.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => deleteEntry(entry.id)}
                    className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};