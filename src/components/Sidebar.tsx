import { useState } from 'react';
import {
  Sparkles,
  ShoppingBag,
  Rocket,
  LayoutDashboard,
  History,
  CreditCard,
  Receipt,
  PanelLeftClose,
  PanelLeft,
  FileCode,
  Trash2,
} from 'lucide-react';
import { TEMPLATES, type Template, type Project, type ProjectVersion } from '@/lib/types';

interface SidebarProps {
  activeView: 'builder' | 'subscription' | 'transactions';
  onViewChange: (view: 'builder' | 'subscription' | 'transactions') => void;
  selectedTemplate: Template | null;
  onTemplateSelect: (template: Template) => void;
  projects: Project[];
  activeProject: Project | null;
  onProjectSelect: (project: Project) => void;
  versions: ProjectVersion[];
  onVersionSelect: (version: ProjectVersion) => void;
  onDeleteProject: (id: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const iconMap: Record<string, React.ComponentType<{ size?: number | string; className?: string }>> = {
  ShoppingBag,
  Rocket,
  LayoutDashboard,
  Sparkles,
};

export default function Sidebar({
  activeView,
  onViewChange,
  selectedTemplate,
  onTemplateSelect,
  projects,
  activeProject,
  onProjectSelect,
  versions,
  onVersionSelect,
  onDeleteProject,
  collapsed,
  onToggleCollapse,
}: SidebarProps) {
  const [activeTab, setActiveTab] = useState<'templates' | 'history'>('templates');

  if (collapsed) {
    return (
      <div className="w-16 bg-slate-900 flex flex-col items-center py-4 gap-6 border-r border-slate-800 shrink-0">
        <button
          onClick={onToggleCollapse}
          className="text-slate-400 hover:text-white transition-colors"
          title="Expand sidebar"
        >
          <PanelLeft size={20} />
        </button>
        <button
          onClick={() => { onViewChange('builder'); setActiveTab('templates'); }}
          className={`p-2 rounded-lg transition-colors ${activeView === 'builder' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white'}`}
          title="Builder"
        >
          <Sparkles size={20} />
        </button>
        <button
          onClick={() => onViewChange('subscription')}
          className={`p-2 rounded-lg transition-colors ${activeView === 'subscription' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white'}`}
          title="Subscription"
        >
          <CreditCard size={20} />
        </button>
        <button
          onClick={() => onViewChange('transactions')}
          className={`p-2 rounded-lg transition-colors ${activeView === 'transactions' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white'}`}
          title="Transactions"
        >
          <Receipt size={20} />
        </button>
      </div>
    );
  }

  return (
    <div className="w-72 bg-slate-900 flex flex-col border-r border-slate-800 shrink-0 h-full">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shrink-0">
            <Sparkles size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-none">Ebnili</h1>
            <p className="text-slate-500 text-[10px] mt-0.5">ابنيلي · AI Builder</p>
          </div>
        </div>
        <button
          onClick={onToggleCollapse}
          className="text-slate-400 hover:text-white transition-colors"
          title="Collapse sidebar"
        >
          <PanelLeftClose size={18} />
        </button>
      </div>

      <div className="flex gap-1 px-3 pt-3">
        <button
          onClick={() => setActiveTab('templates')}
          className={`flex-1 text-xs font-semibold py-2 rounded-lg transition-colors ${
            activeTab === 'templates' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          Templates
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 text-xs font-semibold py-2 rounded-lg transition-colors ${
            activeTab === 'history' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          History
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3">
        {activeTab === 'templates' ? (
          <div className="space-y-2">
            {TEMPLATES.map((template) => {
              const Icon = iconMap[template.icon] || Sparkles;
              const isActive = selectedTemplate?.id === template.id;
              return (
                <button
                  key={template.id}
                  onClick={() => onTemplateSelect(template)}
                  className={`w-full text-left p-3 rounded-xl transition-all border ${
                    isActive
                      ? 'bg-slate-800 border-orange-500/50'
                      : 'bg-slate-800/50 border-transparent hover:bg-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      isActive ? 'bg-orange-500/20' : 'bg-slate-700/50'
                    }`}>
                      <Icon size={18} className={isActive ? 'text-orange-400' : 'text-slate-400'} />
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm font-semibold ${isActive ? 'text-white' : 'text-slate-300'}`}>
                        {template.name}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{template.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}

            <div className="pt-3 mt-3 border-t border-slate-800">
              <p className="text-[10px] uppercase tracking-wider text-slate-600 font-semibold px-1 mb-2">Recent Projects</p>
              {projects.length === 0 ? (
                <p className="text-xs text-slate-600 px-1 py-2">No projects yet</p>
              ) : (
                projects.slice(0, 8).map((project) => (
                  <div
                    key={project.id}
                    className={`group flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                      activeProject?.id === project.id ? 'bg-slate-800' : 'hover:bg-slate-800/50'
                    }`}
                    onClick={() => onProjectSelect(project)}
                  >
                    <FileCode size={14} className="text-slate-500 shrink-0" />
                    <p className="text-xs text-slate-300 truncate flex-1">{project.name}</p>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDeleteProject(project.id); }}
                      className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all shrink-0"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-1 mb-2">
              <History size={14} className="text-slate-500" />
              <p className="text-[10px] uppercase tracking-wider text-slate-600 font-semibold">Version History</p>
            </div>
            {versions.length === 0 ? (
              <p className="text-xs text-slate-600 px-1 py-4 text-center">No versions yet. Generate an app to create history.</p>
            ) : (
              versions.map((version, idx) => (
                <button
                  key={version.id}
                  onClick={() => onVersionSelect(version)}
                  className="w-full text-left p-2.5 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-300">{version.version_label}</span>
                    <span className="text-[10px] text-slate-600">
                      {new Date(version.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">{version.prompt}</p>
                  {idx === 0 && (
                    <span className="inline-block mt-1.5 text-[9px] font-bold text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded">
                      LATEST
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        )}
      </div>

      <div className="border-t border-slate-800 p-3 space-y-1">
        <button
          onClick={() => onViewChange('builder')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            activeView === 'builder' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Sparkles size={16} />
          Builder
        </button>
        <button
          onClick={() => onViewChange('subscription')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            activeView === 'subscription' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <CreditCard size={16} />
          Subscription
        </button>
        <button
          onClick={() => onViewChange('transactions')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            activeView === 'transactions' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Receipt size={16} />
          Transactions
        </button>
      </div>
    </div>
  );
}
