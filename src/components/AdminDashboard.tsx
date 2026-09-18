import { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  Users,
  DollarSign,
  TrendingUp,
  Receipt,
  Check,
  X,
  Clock,
  Loader2,
  ArrowLeft,
  Crown,
  Zap,
  CreditCard,
  Activity,
  Settings,
  Key,
  Save,
  AlertCircle,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface AdminStats {
  total_users: number;
  total_projects: number;
  total_revenue: number;
  active_subscriptions: number;
  pending_transactions: number;
  pro_users: number;
  starter_users: number;
  free_users: number;
}

interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  credits: number;
  subscription_tier: string;
  created_at: string;
  project_count: number;
}

interface AdminTransaction {
  id: string;
  user_id: string;
  sender_mobile: string;
  receipt_code: string;
  amount: number;
  status: string;
  tier: string;
  created_at: string;
  reviewed_at: string | null;
  user_email: string;
}

interface AdminDashboardProps {
  onBack: () => void;
}

export default function AdminDashboard({ onBack }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'transactions' | 'settings'>('overview');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const [geminiKey, setGeminiKey] = useState('');
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [settingsError, setSettingsError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, txRes] = await Promise.all([
        supabase.rpc('admin_get_stats'),
        supabase.rpc('admin_get_users'),
        supabase.rpc('admin_get_transactions'),
      ]);

      if (statsRes.data) setStats(statsRes.data as AdminStats);
      if (usersRes.data) setUsers(usersRes.data as AdminUser[]);
      if (txRes.data) setTransactions(txRes.data as AdminTransaction[]);
    } catch (err) {
      console.error('Admin data load error:', err);
    }
    setLoading(false);
  }, []);

  const loadSettings = useCallback(async () => {
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'gemini_api_key')
      .maybeSingle();
    if (!error && data?.value) {
      setGeminiKey(data.value);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (activeTab === 'settings') {
      loadSettings();
    }
  }, [activeTab, loadSettings]);

  const handleUpdateTransaction = async (txId: string, newStatus: 'verified' | 'rejected') => {
    await supabase.rpc('admin_update_transaction', { tx_id: txId, new_status: newStatus });
    loadData();
  };

  const handleUpdateUserRole = async (userId: string, newRole: 'user' | 'admin') => {
    await supabase.rpc('admin_update_user_role', { target_user_id: userId, new_role: newRole });
    loadData();
  };

  const handleSaveSettings = async () => {
    setSettingsLoading(true);
    setSettingsError('');
    setSettingsSaved(false);

    try {
      const { error } = await supabase
        .from('app_settings')
        .upsert({ key: 'gemini_api_key', value: geminiKey.trim() }, { onConflict: 'key' });

      if (error) throw error;
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 3000);
    } catch (err) {
      setSettingsError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSettingsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <Loader2 size={28} className="animate-spin text-slate-400" />
      </div>
    );
  }

  const statCards = [
    { label: 'Total Users', value: stats?.total_users ?? 0, icon: Users, color: 'from-blue-500 to-cyan-500' },
    { label: 'Total Revenue', value: `${stats?.total_revenue ?? 0} EGP`, icon: DollarSign, color: 'from-green-500 to-emerald-500' },
    { label: 'Active Subs', value: stats?.active_subscriptions ?? 0, icon: CreditCard, color: 'from-orange-500 to-amber-500' },
    { label: 'Total Projects', value: stats?.total_projects ?? 0, icon: Activity, color: 'from-sky-500 to-blue-500' },
    { label: 'PRO Users', value: stats?.pro_users ?? 0, icon: Crown, color: 'from-amber-500 to-yellow-500' },
    { label: 'Pending Tx', value: stats?.pending_transactions ?? 0, icon: Clock, color: 'from-red-500 to-rose-500' },
  ];

  return (
    <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
      <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-500">
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
              <Shield size={16} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Admin Dashboard</h2>
              <p className="text-xs text-slate-500">Platform overview & management</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
          {(['overview', 'users', 'transactions', 'settings'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-all ${
                activeTab === tab ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'overview' && (
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              {statCards.map((card, i) => {
                const Icon = card.icon;
                return (
                  <div key={i} className="bg-white rounded-xl border border-slate-200 p-5">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-3`}>
                      <Icon size={20} className="text-white" />
                    </div>
                    <p className="text-xs text-slate-400 font-medium">{card.label}</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{card.value}</p>
                  </div>
                );
              })}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h3 className="text-sm font-semibold text-slate-700 mb-4">Subscription Distribution</h3>
                <div className="space-y-3">
                  {[
                    { label: 'PRO', count: stats?.pro_users ?? 0, total: stats?.total_users ?? 1, color: 'bg-orange-500', icon: Crown },
                    { label: 'Starter', count: stats?.starter_users ?? 0, total: stats?.total_users ?? 1, color: 'bg-blue-500', icon: Zap },
                    { label: 'Free', count: stats?.free_users ?? 0, total: stats?.total_users ?? 1, color: 'bg-slate-400', icon: Users },
                  ].map((tier) => {
                    const Icon = tier.icon;
                    const pct = tier.total > 0 ? Math.round((tier.count / tier.total) * 100) : 0;
                    return (
                      <div key={tier.label}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                            <Icon size={13} /> {tier.label}
                          </span>
                          <span className="text-xs text-slate-400">{tier.count} ({pct}%)</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div className={`h-full ${tier.color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h3 className="text-sm font-semibold text-slate-700 mb-4">Revenue Overview</h3>
                <div className="text-center py-4">
                  <p className="text-4xl font-bold text-slate-900">{stats?.total_revenue ?? 0}</p>
                  <p className="text-sm text-slate-400 mt-1">EGP Total Revenue</p>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="p-3 rounded-lg bg-green-50 text-center">
                    <p className="text-xs text-green-600 font-medium">Active Subs</p>
                    <p className="text-xl font-bold text-green-700">{stats?.active_subscriptions ?? 0}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-amber-50 text-center">
                    <p className="text-xs text-amber-600 font-medium">Pending</p>
                    <p className="text-xl font-bold text-amber-700">{stats?.pending_transactions ?? 0}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="max-w-5xl mx-auto">
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase">User</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase">Plan</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase">Credits</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase">Projects</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase">Role</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {user.email[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-800">{user.full_name || '—'}</p>
                            <p className="text-xs text-slate-400">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          user.subscription_tier === 'pro' ? 'text-orange-600 bg-orange-50' :
                          user.subscription_tier === 'starter' ? 'text-blue-600 bg-blue-50' :
                          'text-slate-500 bg-slate-100'
                        }`}>
                          {user.subscription_tier}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-sm text-slate-600">{user.credits}</td>
                      <td className="px-5 py-3 text-sm text-slate-600">{user.project_count}</td>
                      <td className="px-5 py-3">
                        <button
                          onClick={() => handleUpdateUserRole(user.id, user.role === 'admin' ? 'user' : 'admin')}
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full transition-colors ${
                            user.role === 'admin' ? 'text-orange-600 bg-orange-50 hover:bg-orange-100' : 'text-slate-500 bg-slate-100 hover:bg-slate-200'
                          }`}
                        >
                          {user.role}
                        </button>
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-400">
                        {new Date(user.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr><td colSpan={6} className="px-5 py-12 text-center text-sm text-slate-400">No users found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="max-w-5xl mx-auto">
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase">User</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase">Mobile</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase">Receipt</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase">Amount</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase">Tier</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase">Status</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3 text-sm text-slate-600">{tx.user_email || '—'}</td>
                      <td className="px-5 py-3 text-sm text-slate-600">{tx.sender_mobile}</td>
                      <td className="px-5 py-3 text-sm text-slate-600 font-mono">{tx.receipt_code}</td>
                      <td className="px-5 py-3 text-sm font-semibold text-slate-800">{tx.amount} EGP</td>
                      <td className="px-5 py-3">
                        <span className="text-xs font-semibold capitalize text-slate-600">{tx.tier}</span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          tx.status === 'verified' ? 'text-green-600 bg-green-50' :
                          tx.status === 'pending' ? 'text-amber-600 bg-amber-50' :
                          'text-red-600 bg-red-50'
                        }`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        {tx.status === 'pending' && (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleUpdateTransaction(tx.id, 'verified')}
                              className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                              title="Approve"
                            >
                              <Check size={15} />
                            </button>
                            <button
                              onClick={() => handleUpdateTransaction(tx.id, 'rejected')}
                              className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                              title="Reject"
                            >
                              <X size={15} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {transactions.length === 0 && (
                    <tr><td colSpan={7} className="px-5 py-12 text-center text-sm text-slate-400">No transactions found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                  <Key size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">API Settings</h3>
                  <p className="text-xs text-slate-500">Configure AI generation keys</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Gemini API Key</label>
                  <input
                    type="password"
                    value={geminiKey}
                    onChange={(e) => setGeminiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all"
                  />
                  <p className="text-xs text-slate-400 mt-1.5">
                    Get a free key from{' '}
                    <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:underline">
                      Google AI Studio
                    </a>
                    . The key is stored securely and used by the server to generate apps.
                  </p>
                </div>

                {settingsError && (
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-50 border border-red-200">
                    <AlertCircle size={16} className="text-red-500 shrink-0" />
                    <p className="text-xs text-red-600">{settingsError}</p>
                  </div>
                )}

                {settingsSaved && (
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-green-50 border border-green-200">
                    <Check size={16} className="text-green-500 shrink-0" />
                    <p className="text-xs text-green-600">Settings saved successfully. AI generation is now active.</p>
                  </div>
                )}

                <button
                  onClick={handleSaveSettings}
                  disabled={settingsLoading || !geminiKey.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-orange-500 transition-colors disabled:opacity-50"
                >
                  {settingsLoading ? (
                    <><Loader2 size={16} className="animate-spin" /> Saving...</>
                  ) : (
                    <><Save size={16} /> Save Settings</>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
