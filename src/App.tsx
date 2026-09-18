import { useState, useEffect, useCallback } from 'react';
import { Crown, Sparkles, Loader2 } from 'lucide-react';
import { AuthProvider, useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { streamGenerate } from '@/lib/generator';
import type { Project, ProjectVersion, Subscription, Template } from '@/lib/types';

import LandingPage from '@/components/LandingPage';
import AuthPage from '@/components/AuthPage';
import Sidebar from '@/components/Sidebar';
import PromptInput from '@/components/PromptInput';
import LivePreview from '@/components/LivePreview';
import SubscriptionModal from '@/components/SubscriptionModal';
import TransactionHistory from '@/components/TransactionHistory';
import AdminDashboard from '@/components/AdminDashboard';

type View = 'landing' | 'signin' | 'signup' | 'builder' | 'subscription' | 'transactions' | 'admin';

function AppContent() {
  const { user, profile, loading, signOut, refreshProfile } = useAuth();
  const [view, setView] = useState<View>('landing');
  const [sidebarView, setSidebarView] = useState<'builder' | 'subscription' | 'transactions' | 'admin'>('builder');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [versions, setVersions] = useState<ProjectVersion[]>([]);
  const [previewCode, setPreviewCode] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamStatus, setStreamStatus] = useState('');
  const [showSubModal, setShowSubModal] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (user) {
      if (view === 'landing' || view === 'signin' || view === 'signup') {
        setView('builder');
      }
    } else {
      if (view !== 'landing' && view !== 'signin' && view !== 'signup') {
        setView('landing');
      }
    }
  }, [user, loading, view]);

  const loadProjects = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });
    if (!error && data) {
      setProjects(data as Project[]);
    }
  }, [user]);

  const loadVersions = useCallback(async (projectId: string) => {
    const { data, error } = await supabase
      .from('project_versions')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    if (!error && data) {
      setVersions(data as ProjectVersion[]);
    }
  }, []);

  useEffect(() => {
    if (user && view === 'builder') {
      loadProjects();
    }
  }, [user, view, loadProjects]);

  const handleGenerate = async (prompt: string) => {
    if (!user || !profile) return;
    const isPro = profile.subscription_tier === 'pro';
    if (!isPro && profile.credits <= 0) {
      setShowSubModal(true);
      return;
    }

    setIsGenerating(true);
    setStreamStatus('Starting');

    try {
      const code = await streamGenerate(prompt, selectedTemplate || undefined, {
        onStatus: (status) => setStreamStatus(status),
      });

      setPreviewCode(code);

      const templateType = selectedTemplate?.category || 'landing-page';
      const projectName = prompt.slice(0, 40) + (prompt.length > 40 ? '...' : '');

      const { data: projectData, error: projectErr } = await supabase
        .from('projects')
        .insert({
          name: projectName,
          prompt,
          code,
          template_type: templateType,
        })
        .select()
        .single();

      if (projectErr) throw projectErr;

      const newProject = projectData as Project;
      setActiveProject(newProject);
      setProjects((prev) => [newProject, ...prev]);

      await supabase
        .from('project_versions')
        .insert({
          project_id: newProject.id,
          version_label: 'v1',
          prompt,
          code,
        });

      if (!isPro) {
        await supabase
          .from('profiles')
          .update({ credits: profile.credits - 1 })
          .eq('id', user.id);
        refreshProfile();
      }

      await loadVersions(newProject.id);
    } catch (err) {
      console.error('Generation error:', err);
    } finally {
      setIsGenerating(false);
      setStreamStatus('');
    }
  };

  const handleProjectSelect = (project: Project) => {
    setActiveProject(project);
    setPreviewCode(project.code);
    loadVersions(project.id);
    setSidebarView('builder');
  };

  const handleVersionSelect = (version: ProjectVersion) => {
    setPreviewCode(version.code);
  };

  const handleDeleteProject = async (id: string) => {
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (!error) {
      setProjects((prev) => prev.filter((p) => p.id !== id));
      if (activeProject?.id === id) {
        setActiveProject(null);
        setPreviewCode('');
        setVersions([]);
      }
    }
  };

  const handleResetPreview = () => {
    setPreviewCode('');
    setActiveProject(null);
    setVersions([]);
  };

  const handleSignOut = async () => {
    await signOut();
    setView('landing');
    setProjects([]);
    setActiveProject(null);
    setVersions([]);
    setPreviewCode('');
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center mx-auto mb-4">
            <Sparkles size={24} className="text-white" />
          </div>
          <Loader2 size={20} className="animate-spin text-slate-400 mx-auto" />
        </div>
      </div>
    );
  }

  if (!user) {
    if (view === 'signin') {
      return <AuthPage mode="signin" onBack={() => setView('landing')} onSuccess={() => setView('builder')} onSwitchMode={(m) => setView(m)} />;
    }
    if (view === 'signup') {
      return <AuthPage mode="signup" onBack={() => setView('landing')} onSuccess={() => setView('builder')} onSwitchMode={(m) => setView(m)} />;
    }
    return <LandingPage onNavigate={(v) => setView(v)} />;
  }

  const effectiveSidebarView = view === 'builder' || view === 'subscription' || view === 'transactions' || view === 'admin' ? view : sidebarView;

  return (
    <div className="h-screen flex bg-slate-100 overflow-hidden">
      <Sidebar
        activeView={effectiveSidebarView as 'builder' | 'subscription' | 'transactions' | 'admin'}
        onViewChange={(v) => { setSidebarView(v); setView(v); }}
        selectedTemplate={selectedTemplate}
        onTemplateSelect={setSelectedTemplate}
        projects={projects}
        activeProject={activeProject}
        onProjectSelect={handleProjectSelect}
        versions={versions}
        onVersionSelect={handleVersionSelect}
        onDeleteProject={handleDeleteProject}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        profile={profile}
        onSignOut={handleSignOut}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {(effectiveSidebarView === 'builder') && (
          <>
            <div className="flex items-center justify-between px-5 py-2.5 bg-white border-b border-slate-200 shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-orange-500" />
                <span className="text-sm font-semibold text-slate-700">
                  {activeProject ? activeProject.name : 'New Project'}
                </span>
                {activeProject && (
                  <span className="text-xs text-slate-400">
                    · {versions.length} version{versions.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {profile?.subscription_tier !== 'free' && profile?.subscription_tier !== undefined ? (
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-orange-600 bg-orange-50 px-3 py-1.5 rounded-full">
                    <Crown size={13} />
                    {profile.subscription_tier.toUpperCase()}
                  </span>
                ) : (
                  <button
                    onClick={() => setShowSubModal(true)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-white bg-gradient-to-r from-orange-500 to-amber-500 px-3 py-1.5 rounded-full hover:opacity-90 transition-opacity"
                  >
                    <Crown size={13} /> Upgrade
                  </button>
                )}
              </div>
            </div>

            <PromptInput
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
              streamStatus={streamStatus}
              selectedTemplate={selectedTemplate}
              onClearTemplate={() => setSelectedTemplate(null)}
              profile={profile}
            />

            <LivePreview code={previewCode} onReset={handleResetPreview} />
          </>
        )}

        {effectiveSidebarView === 'subscription' && (
          <div className="flex-1 flex flex-col bg-slate-50 overflow-y-auto">
            <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Subscription</h2>
                <p className="text-xs text-slate-500">Manage your Ebnili plan</p>
              </div>
              <button
                onClick={() => setShowSubModal(true)}
                className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-orange-500 transition-colors"
              >
                {profile?.subscription_tier && profile.subscription_tier !== 'free' ? 'Change Plan' : 'Subscribe Now'}
              </button>
            </div>
            <div className="p-6 max-w-2xl mx-auto w-full">
              {profile?.subscription_tier && profile.subscription_tier !== 'free' ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                      <Crown size={26} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">{profile.subscription_tier.toUpperCase()} Plan</h3>
                      <p className="text-sm text-slate-500">Your subscription is active</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className="p-3 rounded-lg bg-slate-50">
                      <p className="text-xs text-slate-400">Status</p>
                      <p className="text-sm font-semibold text-green-600">Active</p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50">
                      <p className="text-xs text-slate-400">Credits</p>
                      <p className="text-sm font-semibold text-slate-700">
                        {profile.subscription_tier === 'pro' ? 'Unlimited' : `${profile.credits} remaining`}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                    <Crown size={28} className="text-slate-400" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Free Plan</h3>
                  <p className="text-sm text-slate-500 mb-1">{profile?.credits ?? 0} credits remaining</p>
                  <p className="text-sm text-slate-500 mb-4">Subscribe to unlock unlimited AI app generation and premium features.</p>
                  <button
                    onClick={() => setShowSubModal(true)}
                    className="px-6 py-3 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-orange-500 transition-colors"
                  >
                    View Plans
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {effectiveSidebarView === 'transactions' && (
          <TransactionHistory
            onBack={() => { setSidebarView('builder'); setView('builder'); }}
            onManageSubscription={() => setShowSubModal(true)}
          />
        )}

        {effectiveSidebarView === 'admin' && profile?.role === 'admin' && (
          <AdminDashboard onBack={() => { setSidebarView('builder'); setView('builder'); }} />
        )}

        {effectiveSidebarView === 'admin' && profile?.role !== 'admin' && (
          <div className="flex-1 flex items-center justify-center bg-slate-50">
            <p className="text-sm text-slate-400">Access denied. Admin role required.</p>
          </div>
        )}
      </div>

      <SubscriptionModal
        open={showSubModal}
        onClose={() => setShowSubModal(false)}
        onSubscribed={() => { refreshProfile(); loadProjects(); }}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
