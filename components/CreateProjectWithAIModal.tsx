import React, { useState } from 'react';
import { X, Sparkles, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { AIService } from '../services/ai.service';
import { api } from '../services/apiClient';
import { AIGeneratedProject, TaskPriority } from '../types';
import { useNavigate } from 'react-router-dom';

interface CreateProjectWithAIModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CreateProjectWithAIModal: React.FC<CreateProjectWithAIModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const navigate = useNavigate();
  
  // Form State
  const [prompt, setPrompt] = useState('');
  const [teamSize, setTeamSize] = useState<number>(3);
  const [deadline, setDeadline] = useState<string>('');
  
  // Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedProject, setGeneratedProject] = useState<AIGeneratedProject | null>(null);
  
  // Save State
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsGenerating(true);
    setGeneratedProject(null);

    try {
      const result = await AIService.generateProject({
        prompt,
        teamSize,
        deadline,
      });
      setGeneratedProject(result);
    } catch (err: any) {
      setError(err.message || 'Failed to generate project with AI. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!generatedProject) return;
    
    setIsSaving(true);
    setError(null);
    try {
      // 1. Create Project
      const project = await api.projects.create({
        name: generatedProject.name,
        description: generatedProject.description,
        projectGoal: generatedProject.projectGoal,
        teamSize: generatedProject.teamSize,
        deadline: generatedProject.deadline,
        projectContext: `AI Generated from Prompt: ${prompt}`,
      });

      // 2. Create Milestones
      const createdMilestones = [];
      for (const m of generatedProject.milestones) {
        const newMilestone = await api.milestones.create({
          projectId: project.id,
          title: m.title,
          description: m.description,
          dueDate: m.dueDate || generatedProject.deadline,
        });
        createdMilestones.push(newMilestone);
      }

      // 3. Create Tasks
      for (const t of generatedProject.tasks) {
        let milestoneId = undefined;
        let taskDueDate = undefined;
        
        if (t.milestoneIndex !== undefined && createdMilestones[t.milestoneIndex]) {
          milestoneId = createdMilestones[t.milestoneIndex].id;
          taskDueDate = createdMilestones[t.milestoneIndex].dueDate;
        }

        await api.tasks.create({
          projectId: project.id,
          milestoneId,
          title: t.title,
          description: t.description || `Estimated effort: ${t.estimatedDays || 1} days`,
          priority: t.priority,
          status: 'TODO',
          dueDate: taskDueDate,
        });
      }

      if (onSuccess) onSuccess();
      onClose();
      navigate(`/projects/${project.id}`);
      
    } catch (err: any) {
      setError(err.message || 'Failed to save the generated project.');
    } finally {
      setIsSaving(false);
    }
  };

  const renderForm = () => (
    <form onSubmit={handleGenerate} className="space-y-6">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-300">Project Concept / Goal</label>
        <textarea
          required
          rows={4}
          className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl focus:border-neon-purple focus:ring-1 focus:ring-neon-purple outline-none text-white placeholder-slate-600 transition-all resize-none"
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="e.g., We need to build a mobile app for pet owners to find nearby vets, track vaccinations, and schedule grooming appointments..."
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-300">Team Size</label>
          <input
            type="number"
            min="1"
            required
            className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl focus:border-neon-purple focus:ring-1 focus:ring-neon-purple outline-none text-white transition-all"
            value={teamSize}
            onChange={e => setTeamSize(parseInt(e.target.value) || 1)}
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-300">Target Deadline</label>
          <input
            type="date"
            required
            className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl focus:border-neon-purple focus:ring-1 focus:ring-neon-purple outline-none text-white transition-all"
            value={deadline}
            onChange={e => setDeadline(e.target.value)}
            style={{ colorScheme: 'dark' }}
          />
        </div>
      </div>

      <div className="pt-4 flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="px-5 py-2.5 text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isGenerating || !prompt || !deadline}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-neon-purple hover:shadow-[0_0_20px_rgba(188,19,254,0.4)] rounded-xl transition-all duration-300 disabled:opacity-50"
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              Generating...
            </>
          ) : (
            <>
              <Sparkles size={18} />
              Generate Blueprint
            </>
          )}
        </button>
      </div>
    </form>
  );

  const renderPreview = () => {
    if (!generatedProject) return null;
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="p-4 bg-neon-purple/10 border border-neon-purple/20 rounded-xl space-y-3">
          <h4 className="text-xl font-bold text-white font-display">{generatedProject.name}</h4>
          <p className="text-sm text-slate-300">{generatedProject.description}</p>
        </div>

        <div>
          <h5 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Generated Milestones ({generatedProject.milestones.length})</h5>
          <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
            {generatedProject.milestones.map((m, i) => (
              <div key={i} className="p-3 bg-black/20 border border-white/5 rounded-lg flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-neon-purple/20 text-neon-purple flex items-center justify-center text-xs font-bold">
                  {i + 1}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{m.title}</p>
                  <p className="text-xs text-slate-400 mt-1">{m.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h5 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Generated Tasks ({generatedProject.tasks.length})</h5>
          <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
            {generatedProject.tasks.map((t, i) => (
              <div key={i} className="p-3 bg-black/20 border border-white/5 rounded-lg flex justify-between items-start gap-4">
                <div>
                  <p className="text-sm font-medium text-white">{t.title}</p>
                  <p className="text-xs text-slate-400 mt-1">{t.description}</p>
                </div>
                <div className="flex-shrink-0 text-xs px-2 py-1 rounded-md bg-white/5 text-slate-300 border border-white/10">
                  {t.priority}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 flex justify-between items-center border-t border-white/10">
           <button
            type="button"
            onClick={() => setGeneratedProject(null)}
            className="text-sm text-slate-400 hover:text-white transition-colors"
          >
            Regenerate
          </button>
          
          <div className="flex gap-3">
             <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-black bg-neon-blue hover:bg-white hover:shadow-[0_0_20px_rgba(0,243,255,0.4)] rounded-xl transition-all duration-300 disabled:opacity-50"
            >
              {isSaving ? 'Creating Project...' : 'Initialize Project'}
              {!isSaving && <ArrowRight size={18} />}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="glass-panel w-full max-w-2xl overflow-hidden animate-scale-up border border-neon-purple/20 shadow-[0_0_50px_rgba(188,19,254,0.1)] rounded-2xl flex flex-col max-h-[90vh]">
        
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/5 flex-shrink-0">
          <h3 className="text-xl font-bold text-white font-display tracking-tight flex items-center gap-2">
            <span className="w-2 h-2 bg-neon-purple rounded-full shadow-[0_0_5px_#bc13fe]"></span>
            Create Project with AI
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white hover:rotate-90 transition-all duration-300">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-grow">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex gap-3 text-red-200 text-sm">
              <AlertCircle size={18} className="flex-shrink-0 text-red-400" />
              <p>{error}</p>
            </div>
          )}

          {!generatedProject ? renderForm() : renderPreview()}
        </div>
      </div>
    </div>
  );
};
