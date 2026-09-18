import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Sparkles, ChevronDown, Zap } from 'lucide-react';
import type { Template, Profile } from '@/lib/types';

interface PromptInputProps {
  onGenerate: (prompt: string) => void;
  isGenerating: boolean;
  streamStatus: string;
  selectedTemplate: Template | null;
  onClearTemplate: () => void;
  profile: Profile | null;
}

const SUGGESTIONS = [
  'Create a modern e-commerce store with product grid and cart',
  'Build a SaaS landing page with hero, features, and pricing',
  'Design an analytics dashboard with charts and data tables',
  'Make a portfolio website with projects gallery',
];

export default function PromptInput({ onGenerate, isGenerating, streamStatus, selectedTemplate, onClearTemplate, profile }: PromptInputProps) {
  const [prompt, setPrompt] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [prompt]);

  const handleSubmit = () => {
    if (!prompt.trim() || isGenerating) return;
    onGenerate(prompt.trim());
    setPrompt('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const credits = profile?.credits ?? 0;
  const isPro = profile?.subscription_tier === 'pro';
  const hasCredits = isPro || credits > 0;

  return (
    <div className="border-b border-slate-200 bg-white shrink-0">
      <div className="px-6 py-4">
        <div className="flex items-center gap-2 mb-3">
          {selectedTemplate && selectedTemplate.category !== 'blank' && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full">
              <Sparkles size={12} />
              {selectedTemplate.name}
            </span>
          )}
          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${
            isPro ? 'text-orange-600 bg-orange-50' : credits > 0 ? 'text-blue-600 bg-blue-50' : 'text-red-600 bg-red-50'
          }`}>
            <Zap size={12} />
            {isPro ? 'Unlimited' : `${credits} credits left`}
          </span>
          {selectedTemplate && selectedTemplate.category !== 'blank' && (
            <button onClick={onClearTemplate} className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
              Clear
            </button>
          )}
        </div>

        <div className="relative">
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={hasCredits ? "Describe the web app you want to build..." : "No credits left. Upgrade to continue building."}
            rows={1}
            disabled={isGenerating || !hasCredits}
            className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-14 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-orange-400 focus:bg-white transition-all disabled:opacity-60"
          />
          <button
            onClick={handleSubmit}
            disabled={!prompt.trim() || isGenerating || !hasCredits}
            className="absolute right-2.5 bottom-2.5 w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center hover:bg-orange-500 disabled:opacity-30 disabled:hover:bg-slate-900 transition-all shrink-0"
            title="Generate (Cmd/Ctrl + Enter)"
          >
            {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>

        <div className="flex items-center justify-between mt-2.5">
          <button
            onClick={() => setShowSuggestions(!showSuggestions)}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 transition-colors"
          >
            <Sparkles size={12} />
            Suggestions
            <ChevronDown size={12} className={`transition-transform ${showSuggestions ? 'rotate-180' : ''}`} />
          </button>
          <span className="text-[11px] text-slate-400">⌘ + Enter to generate</span>
        </div>

        {showSuggestions && (
          <div className="mt-2 space-y-1">
            {SUGGESTIONS.map((suggestion, i) => (
              <button
                key={i}
                onClick={() => { setPrompt(suggestion); setShowSuggestions(false); }}
                className="block w-full text-left text-xs text-slate-600 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        {isGenerating && (
          <div className="mt-3 flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-orange-50 border border-orange-100">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-xs font-medium text-orange-700">{streamStatus}...</span>
          </div>
        )}
      </div>
    </div>
  );
}
