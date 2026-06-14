import React, { useState, useEffect } from 'react';
import { ProjectInsight, Project, Task, UserRole } from '../types';
import { api } from '../services/apiClient';
import { AIService } from '../services/ai.service';
import { useAuth } from '../services/authStore';
import { Activity as ActivityIcon, AlertTriangle, CheckCircle, Clock, Lightbulb, Loader2, RefreshCw, ShieldAlert, TrendingDown, TrendingUp } from 'lucide-react';

interface AIProjectInsightsPanelProps {
  project: Project;
  tasks: Task[];
}

export const AIProjectInsightsPanel: React.FC<AIProjectInsightsPanelProps> = ({ project, tasks }) => {
  const [insight, setInsight] = useState<ProjectInsight | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const { user: currentUser } = useAuth();

  useEffect(() => {
    fetchLatestInsight();
  }, [project.id]);

  const fetchLatestInsight = async () => {
    setIsLoading(true);
    try {
      const data = await api.insights.getLatest(project.id);
      setInsight(data);
    } catch (err) {
      console.error("Failed to load project insights", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateAnalysis = async () => {
    setIsGenerating(true);
    try {
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(t => t.status === 'DONE').length;
      const overdueTasks = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'DONE').length;

      const aiResult = await AIService.analyzeProjectHealth({
        name: project.name,
        description: project.description || '',
        totalTasks,
        completedTasks,
        overdueTasks,
        teamSize: project.teamSize || 1, // Defaulting to 1 if teamSize not set
      });

      const savedInsight = await api.insights.save(project.id, {
        healthScore: aiResult.healthScore,
        riskLevel: aiResult.riskLevel,
        recommendations: aiResult.recommendations,
        delayPrediction: aiResult.delayPrediction,
        bottlenecks: aiResult.bottlenecks,
      });

      setInsight(savedInsight);
    } catch (err: any) {
      console.error(err);
      alert("Failed to run AI Health Analysis: " + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const canRunAnalysis = currentUser?.role === UserRole.OWNER || currentUser?.role === UserRole.MEMBER;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12 glass-panel rounded-2xl border-white/10">
        <Loader2 className="animate-spin text-neon-blue" size={32} />
      </div>
    );
  }

  if (!insight) {
    return (
      <div className="glass-panel p-8 rounded-2xl border-white/10 text-center animate-fade-in">
        <ActivityIcon size={48} className="mx-auto text-slate-500 mb-4 opacity-50" />
        <h3 className="text-xl font-bold text-white mb-2 font-display">Project Health Monitoring</h3>
        <p className="text-slate-400 mb-6 max-w-md mx-auto">
          Run an AI-powered analysis to get insights on your project's health, detect bottlenecks, and predict potential delays.
        </p>
        <button
          onClick={handleGenerateAnalysis}
          disabled={isGenerating || !canRunAnalysis}
          className="bg-neon-blue text-[#0f1020] px-6 py-3 rounded-xl font-bold hover:bg-white transition-colors disabled:opacity-50 flex items-center gap-2 mx-auto"
        >
          {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <ActivityIcon size={18} />}
          {isGenerating ? "Analyzing Project..." : "Run Health Analysis"}
        </button>
      </div>
    );
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'LOW': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30';
      case 'MEDIUM': return 'text-amber-400 bg-amber-400/10 border-amber-400/30';
      case 'HIGH': return 'text-rose-400 bg-rose-400/10 border-rose-400/30';
      default: return 'text-slate-400 bg-slate-400/10 border-slate-400/30';
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 50) return 'text-amber-400';
    return 'text-rose-400';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold text-white font-display">AI Health Insights</h3>
            <span className="text-xs text-slate-500 ml-2">Last updated: {new Date(insight.createdAt).toLocaleString()}</span>
        </div>
        <button
          onClick={handleGenerateAnalysis}
          disabled={isGenerating || !canRunAnalysis}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-xl transition-all border border-white/10 hover:border-white/20 text-sm disabled:opacity-50"
        >
          <RefreshCw size={14} className={isGenerating ? "animate-spin" : ""} />
          Refresh Analysis
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Health Score Card */}
        <div className="glass-panel p-6 rounded-2xl border-white/10 flex flex-col items-center justify-center text-center shadow-[0_0_20px_rgba(0,0,0,0.3)]">
          <h4 className="text-slate-400 font-bold uppercase tracking-wider text-xs mb-4">Health Score</h4>
          <div className="relative flex items-center justify-center w-32 h-32 mb-2">
             <svg className="w-full h-full transform -rotate-90">
                <circle cx="64" cy="64" r="56" className="stroke-white/10" strokeWidth="12" fill="none" />
                <circle 
                  cx="64" cy="64" r="56" 
                  className={`stroke-current ${getHealthColor(insight.healthScore)} transition-all duration-1000 ease-out`} 
                  strokeWidth="12" 
                  fill="none" 
                  strokeDasharray="351.858" 
                  strokeDashoffset={351.858 - (351.858 * insight.healthScore) / 100}
                  strokeLinecap="round"
                />
             </svg>
             <div className="absolute flex flex-col items-center justify-center">
               <span className={`text-4xl font-black font-display tracking-tighter ${getHealthColor(insight.healthScore)}`}>{insight.healthScore}</span>
             </div>
          </div>
          <span className={`px-3 py-1 text-xs font-bold rounded-full border ${getRiskColor(insight.riskLevel)} mt-2`}>
            {insight.riskLevel} RISK
          </span>
        </div>

        {/* Delay Prediction */}
        <div className="glass-panel p-6 rounded-2xl border-white/10 md:col-span-2 shadow-[0_0_20px_rgba(0,0,0,0.3)] flex flex-col justify-center">
            <h4 className="text-slate-400 font-bold uppercase tracking-wider text-xs mb-4 flex items-center gap-2">
                <Clock size={14} className="text-neon-pink" /> 
                Delay Prediction
            </h4>
            <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                <p className="text-white font-medium text-lg leading-relaxed">{insight.delayPrediction || 'No delay predicted. The project is on track.'}</p>
            </div>
        </div>

        {/* Bottlenecks */}
        <div className="glass-panel p-6 rounded-2xl border-white/10 md:col-span-3 shadow-[0_0_20px_rgba(0,0,0,0.3)]">
             <h4 className="text-slate-400 font-bold uppercase tracking-wider text-xs mb-4 flex items-center gap-2">
                <ShieldAlert size={14} className="text-rose-400" /> 
                Detected Bottlenecks
            </h4>
            {insight.bottlenecks && insight.bottlenecks.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {insight.bottlenecks.map((bottleneck, i) => (
                        <div key={i} className="flex items-start gap-3 bg-rose-500/5 border border-rose-500/20 p-3 rounded-xl">
                            <AlertTriangle size={16} className="text-rose-400 mt-0.5 flex-shrink-0" />
                            <p className="text-slate-300 text-sm">{bottleneck}</p>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex items-center gap-3 text-slate-500 bg-white/5 p-4 rounded-xl border border-dashed border-white/10">
                    <CheckCircle size={18} className="text-emerald-500" />
                    <span className="text-sm">No bottlenecks detected at this time.</span>
                </div>
            )}
        </div>

        {/* Recommendations */}
        <div className="glass-panel p-6 rounded-2xl border-white/10 md:col-span-3 shadow-[0_0_20px_rgba(0,0,0,0.3)]">
            <h4 className="text-slate-400 font-bold uppercase tracking-wider text-xs mb-4 flex items-center gap-2">
                <Lightbulb size={14} className="text-amber-400" /> 
                AI Recommendations
            </h4>
            <div className="space-y-3">
                {insight.recommendations && insight.recommendations.map((rec, i) => (
                    <div key={i} className="flex items-start gap-3 bg-black/20 border border-white/5 p-4 rounded-xl hover:border-white/10 transition-colors">
                        <div className="w-6 h-6 rounded-full bg-amber-400/10 flex items-center justify-center flex-shrink-0 text-amber-400 font-bold text-xs">
                            {i + 1}
                        </div>
                        <p className="text-slate-300 text-sm leading-relaxed">{rec}</p>
                    </div>
                ))}
            </div>
        </div>

      </div>
    </div>
  );
};
