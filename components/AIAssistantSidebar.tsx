import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, User as UserIcon, Loader2, MessageSquare, AlertCircle, RefreshCw } from 'lucide-react';
import { Project, Task, User } from '../types';
import { AIService } from '../services/ai.service';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
}

interface AIAssistantSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  tasks: Task[];
  members: User[];
}

export const AIAssistantSidebar: React.FC<AIAssistantSidebarProps> = ({ isOpen, onClose, project, tasks, members }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init',
      role: 'model',
      content: "Hi! I'm Bitspace AI. I have full context of this project. What would you like to know?"
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Caching mechanism: Optional, but the chat state is preserved here as long as the component lives.

  const handleSendMessage = async (text: string = inputValue) => {
    if (!text.trim()) return;

    const newUserMessage: Message = { id: Date.now().toString(), role: 'user', content: text };
    setMessages(prev => [...prev, newUserMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const history = messages.filter(m => m.id !== 'init').map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
      }));

      const reply = await AIService.chatWithWorkspace(text, history, { project, tasks, members });

      const newModelMessage: Message = { id: (Date.now() + 1).toString(), role: 'model', content: reply };
      setMessages(prev => [...prev, newModelMessage]);
    } catch (error) {
      console.error(error);
      const errorMessage: Message = { id: (Date.now() + 1).toString(), role: 'model', content: "Sorry, I encountered an error. Please try again." };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: 'init',
        role: 'model',
        content: "Hi! I'm Bitspace AI. I have full context of this project. What would you like to know?"
      }
    ]);
  };

  const suggestions = [
    "What is the overall project status?",
    "Are there any blockers?",
    "Show me overdue tasks",
    "Give me some recommendations"
  ];

  return (
    <div className={`fixed right-0 top-0 h-full w-full sm:w-[400px] z-50 transform transition-transform duration-300 shadow-2xl flex flex-col bg-[#0f1020] border-l border-white/10 glass-panel ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/20 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-neon-purple/20 rounded-lg">
            <Sparkles className="text-neon-purple" size={20} />
          </div>
          <div>
            <h2 className="text-white font-bold font-display">Workspace AI</h2>
            <p className="text-xs text-slate-400">Powered by Gemini</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleClearHistory} className="p-2 text-slate-400 hover:text-white transition-colors" title="Clear Chat">
            <RefreshCw size={18} />
          </button>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${msg.role === 'user' ? 'bg-neon-blue/20 text-neon-blue' : 'bg-neon-purple/20 text-neon-purple'}`}>
              {msg.role === 'user' ? <UserIcon size={16} /> : <Sparkles size={16} />}
            </div>
            <div className={`max-w-[75%] p-3 rounded-2xl ${msg.role === 'user' ? 'bg-neon-blue/10 text-white rounded-tr-none border border-neon-blue/20' : 'bg-white/5 text-slate-300 rounded-tl-none border border-white/10'}`}>
              {msg.role === 'user' ? (
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              ) : (
                <div className="prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3 flex-row">
            <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-neon-purple/20 text-neon-purple">
              <Sparkles size={16} />
            </div>
            <div className="max-w-[75%] p-3 rounded-2xl bg-white/5 text-slate-300 rounded-tl-none border border-white/10 flex items-center gap-2">
               <Loader2 className="animate-spin text-neon-purple" size={16} />
               <span className="text-sm">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-white/10 bg-black/20 backdrop-blur-md">
        
        {/* Suggested Prompts */}
        {messages.length === 1 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {suggestions.map((s, i) => (
              <button 
                key={i} 
                onClick={() => handleSendMessage(s)}
                className="text-xs px-3 py-1.5 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 text-slate-300 transition-colors whitespace-nowrap"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <div className="relative">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Ask AI about this project..."
            className="w-full bg-black/40 border border-white/10 rounded-xl pl-4 pr-12 py-3 text-sm text-white focus:outline-none focus:border-neon-purple focus:ring-1 focus:ring-neon-purple transition-all"
            disabled={isLoading}
          />
          <button 
            onClick={() => handleSendMessage()}
            disabled={!inputValue.trim() || isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-neon-purple hover:bg-neon-purple/10 rounded-lg disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
