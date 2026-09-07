import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store';
import {
  fetchUsers,
  enableUser,
  disableUser,
  fetchAuditLogs,
  fetchAdminStats,
} from '../store/slices/adminSlice';
import {
  ShieldCheck,
  Users,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Lock,
  Unlock,
  Terminal,
  UserCog,
  Stethoscope,
  ClipboardList,
  BarChart3,
} from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { section } = useParams<{ section?: string }>();
  const { users, auditLogs, stats, loading, error } = useAppSelector((state) => state.admin);
  const sectionToTab = (value?: string): 'overview' | 'users' | 'audit' | 'statistics' => {
    if (value === 'users') return 'users';
    if (value === 'audit-logs') return 'audit';
    if (value === 'statistics') return 'statistics';
    return 'overview';
  };
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'audit' | 'statistics'>(sectionToTab(section));

  useEffect(() => {
    dispatch(fetchAdminStats());
    dispatch(fetchUsers());
    dispatch(fetchAuditLogs());
  }, [dispatch]);

  useEffect(() => {
    setActiveTab(sectionToTab(section));
  }, [section]);

  const handleTabChange = (tab: 'overview' | 'users' | 'audit' | 'statistics') => {
    setActiveTab(tab);
    const pathByTab = {
      overview: '/admin',
      users: '/admin/users',
      audit: '/admin/audit-logs',
      statistics: '/admin/statistics',
    };
    navigate(pathByTab[tab]);
  };

  const handleToggleStatus = (user: any) => {
    const actionText = user.is_active ? 'disable' : user.role === 'doctor' ? 'activate' : 'enable';
    if (window.confirm(`Are you sure you want to ${actionText} the user account: ${user.email}?`)) {
      if (user.is_active) {
        dispatch(disableUser(user.id));
      } else {
        dispatch(enableUser(user.id));
      }
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300';
      case 'doctor':
        return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300';
      default:
        return 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-950/50 dark:text-slate-300';
    }
  };

  const doctors = users.filter((user) => user.role === 'doctor').length;
  const patientUsers = users.filter((user) => user.role === 'patient').length;
  const recentAuditLogs = auditLogs.slice(0, 6);

  return (
    <div className="space-y-6">
      <div className="clinical-panel">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-blue-700 dark:text-blue-300">Administration</p>
            <h1 className="mt-2 flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
              <ShieldCheck className="h-7 w-7 text-blue-700 dark:text-blue-300" />
              Admin Dashboard
            </h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Manage users, monitor platform activity, and review secure audit events.
            </p>
          </div>
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold uppercase text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
            System Control
          </div>
        </div>
      </div>

      <div className="flex max-w-3xl rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'users', label: 'User Management' },
          { id: 'audit', label: 'Audit Logs' },
          { id: 'statistics', label: 'Statistics' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id as any)}
            className={`flex-1 rounded-xl px-3 py-2 text-xs font-semibold transition ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-300">
          {error}
        </div>
      )}

      {loading && !stats && !users.length && !auditLogs.length ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-300" />
        </div>
      ) : (
        <>
          {activeTab === 'overview' && stats && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: 'Total Users', value: stats.total_users, icon: Users },
                  { label: 'Doctors', value: doctors || stats.users_by_role?.doctor || 0, icon: Stethoscope },
                  { label: 'Patients', value: stats.total_patients || patientUsers, icon: UserCog },
                  { label: 'Predictions', value: stats.total_predictions, icon: Activity },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="clinical-card flex items-center justify-between p-6">
                      <div>
                        <p className="text-xs font-semibold uppercase text-slate-500">{item.label}</p>
                        <p className="mt-2 text-3xl font-bold text-slate-950 dark:text-white">{item.value}</p>
                      </div>
                      <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
                        <Icon className="h-6 w-6" />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                <div className="clinical-panel">
                  <h2 className="text-lg font-bold text-slate-950 dark:text-white">System Activity</h2>
                  <div className="mt-5 space-y-4">
                    {Object.entries(stats.predictions_by_disease || {}).map(([disease, count]) => {
                      const percentage = stats.total_predictions ? (Number(count) / stats.total_predictions) * 100 : 0;
                      return (
                        <div key={disease}>
                          <div className="flex justify-between text-sm">
                            <span className="font-medium capitalize text-slate-700 dark:text-slate-300">{disease}</span>
                            <span className="font-semibold text-slate-500">{count} ({percentage.toFixed(0)}%)</span>
                          </div>
                          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-950">
                            <div className="h-full rounded-full bg-blue-600" style={{ width: `${percentage}%` }} />
                          </div>
                        </div>
                      );
                    })}
                    {Object.keys(stats.predictions_by_disease || {}).length === 0 && (
                      <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-800">
                        No prediction activity returned by the backend.
                      </div>
                    )}
                  </div>
                </div>

                <div className="clinical-panel">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-950 dark:text-white">Recent Audit Logs</h2>
                    <button onClick={() => setActiveTab('audit')} className="text-xs font-semibold text-blue-700 hover:text-blue-800 dark:text-blue-300">
                      View all
                    </button>
                  </div>
                  <div className="mt-5 space-y-3">
                    {recentAuditLogs.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-800">
                        No audit logs returned.
                      </div>
                    ) : (
                      recentAuditLogs.map((log) => (
                        <div key={log.id} className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/40">
                          <ClipboardList className="mt-0.5 h-4 w-4 shrink-0 text-blue-700 dark:text-blue-300" />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{log.action}</p>
                            <p className="mt-1 truncate text-xs text-slate-500">{log.user_email} - {new Date(log.created_at).toLocaleString()}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="clinical-table">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500 dark:border-slate-800 dark:bg-slate-950/40">
                    <tr>
                      <th className="px-6 py-4">User ID</th>
                      <th className="px-6 py-4">Email</th>
                      <th className="px-6 py-4">Role</th>
                      <th className="px-6 py-4">Doctor Profile</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Access Controls</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                    {users.map((user) => (
                      <tr key={user.id} className="transition hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="px-6 py-4 font-mono text-xs text-slate-500">{user.id}</td>
                        <td className="px-6 py-4 font-semibold text-slate-950 dark:text-white">{user.email}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${getRoleBadge(user.role)}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500">
                          {user.doctor_profile ? (
                            <div className="space-y-1">
                              <p className="font-semibold text-slate-800 dark:text-slate-200">{user.doctor_profile.specialization}</p>
                              <p>{user.doctor_profile.license_number}</p>
                              <p>{user.doctor_profile.hospital}</p>
                            </div>
                          ) : (
                            <span>-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 text-xs font-semibold ${user.is_active ? 'text-emerald-600 dark:text-emerald-300' : user.role === 'doctor' ? 'text-amber-600 dark:text-amber-300' : 'text-slate-500'}`}>
                            {user.is_active ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                            {user.is_active ? 'Active' : user.role === 'doctor' ? 'Pending' : 'Disabled'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleToggleStatus(user)}
                            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                              user.is_active
                                ? 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300'
                                : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300'
                            }`}
                          >
                            {user.is_active ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                            {user.is_active ? 'Disable Access' : user.role === 'doctor' ? 'Activate Doctor' : 'Enable Access'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'statistics' && stats && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: 'Total Users', value: stats.total_users, icon: Users },
                  { label: 'Active Users', value: stats.active_users, icon: CheckCircle2 },
                  { label: 'Total Patients', value: stats.total_patients, icon: UserCog },
                  { label: 'Total Predictions', value: stats.total_predictions, icon: Activity },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="clinical-card flex items-center justify-between p-6">
                      <div>
                        <p className="text-xs font-semibold uppercase text-slate-500">{item.label}</p>
                        <p className="mt-2 text-3xl font-bold text-slate-950 dark:text-white">{item.value}</p>
                      </div>
                      <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
                        <Icon className="h-6 w-6" />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                <div className="clinical-panel">
                  <h2 className="flex items-center gap-2 text-lg font-bold text-slate-950 dark:text-white">
                    <BarChart3 className="h-5 w-5 text-blue-700 dark:text-blue-300" />
                    Users By Role
                  </h2>
                  <div className="mt-5 space-y-4">
                    {Object.entries(stats.users_by_role || {}).map(([role, count]) => {
                      const percentage = stats.total_users ? (Number(count) / stats.total_users) * 100 : 0;
                      return (
                        <div key={role}>
                          <div className="flex justify-between text-sm">
                            <span className="font-medium capitalize text-slate-700 dark:text-slate-300">{role}</span>
                            <span className="font-semibold text-slate-500">{count} ({percentage.toFixed(0)}%)</span>
                          </div>
                          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-950">
                            <div className="h-full rounded-full bg-blue-600" style={{ width: `${percentage}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="clinical-panel">
                  <h2 className="flex items-center gap-2 text-lg font-bold text-slate-950 dark:text-white">
                    <Activity className="h-5 w-5 text-blue-700 dark:text-blue-300" />
                    Predictions By Disease
                  </h2>
                  <div className="mt-5 space-y-4">
                    {Object.entries(stats.predictions_by_disease || {}).map(([disease, count]) => {
                      const percentage = stats.total_predictions ? (Number(count) / stats.total_predictions) * 100 : 0;
                      return (
                        <div key={disease}>
                          <div className="flex justify-between text-sm">
                            <span className="font-medium capitalize text-slate-700 dark:text-slate-300">{disease}</span>
                            <span className="font-semibold text-slate-500">{count} ({percentage.toFixed(0)}%)</span>
                          </div>
                          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-950">
                            <div className="h-full rounded-full bg-blue-600" style={{ width: `${percentage}%` }} />
                          </div>
                        </div>
                      );
                    })}
                    {Object.keys(stats.predictions_by_disease || {}).length === 0 && (
                      <div className="clinical-empty py-10">No prediction statistics returned by the backend.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="clinical-table">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500 dark:border-slate-800 dark:bg-slate-950/40">
                    <tr>
                      <th className="px-6 py-4">Timestamp</th>
                      <th className="px-6 py-4">User</th>
                      <th className="px-6 py-4">Action</th>
                      <th className="px-6 py-4">IP Address</th>
                      <th className="px-6 py-4">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs dark:divide-slate-800/70">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="transition hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="whitespace-nowrap px-6 py-4 text-slate-500">
                          <span className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" />
                            {new Date(log.created_at).toLocaleString()}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">{log.user_email}</td>
                        <td className="whitespace-nowrap px-6 py-4 font-semibold text-blue-700 dark:text-blue-300">{log.action}</td>
                        <td className="whitespace-nowrap px-6 py-4 text-slate-500">
                          <span className="flex items-center gap-1.5">
                            <Terminal className="h-3.5 w-3.5" />
                            {log.ip_address}
                          </span>
                        </td>
                        <td className="max-w-80 truncate px-6 py-4 text-slate-500" title={log.details}>{log.details}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
