import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import {
  Users,
  Activity,
  AlertTriangle,
  ShieldCheck,
  Clock,
  ChevronRight,
  UserPlus,
  FileText,
  Bell,
  Stethoscope,
  ClipboardList,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store';
import { fetchNotifications } from '../store/slices/notificationSlice';

interface RecentActivity {
  type: string;
  title: string;
  resource: string;
  timestamp: string;
}

interface DashboardData {
  scope: string;
  total_users: number;
  total_patients: number;
  total_predictions: number;
  high_risk_predictions: number;
  recent_activity: RecentActivity[];
}

const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { items: notifications } = useAppSelector((state) => state.notifications);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get('/dashboard/summary');
        setData(response.data);
        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to load dashboard metrics.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    dispatch(fetchNotifications({ limit: 5 }));
  }, [dispatch]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getIconForActivity = (type: string) => {
    switch (type.toLowerCase()) {
      case 'prediction':
        return <Activity className="h-4 w-4 text-blue-600 dark:text-blue-300" />;
      case 'patient':
        return <Users className="h-4 w-4 text-blue-600 dark:text-blue-300" />;
      default:
        return <Clock className="h-4 w-4 text-slate-500" />;
    }
  };

  const highRiskCount = data?.high_risk_predictions || 0;
  const totalPredictions = data?.total_predictions || 0;
  const nonHighRiskCount = Math.max(totalPredictions - highRiskCount, 0);
  const highRiskPercent = totalPredictions ? Math.round((highRiskCount / totalPredictions) * 100) : 0;

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
        <p className="font-semibold">Error Loading Dashboard</p>
        <p className="mt-1 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900 dark:shadow-slate-950/30">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-blue-700 dark:text-blue-300">
              MedPredict Clinical Operations
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
              Hospital Decision Support Dashboard
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">
              Patient registry, diagnostic prediction activity, risk review, and clinical alerts for the current {user?.role} workspace.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold capitalize text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
            <ShieldCheck className="h-4 w-4" />
            {data?.scope || user?.role || 'Clinical'} scope
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Patients', value: data?.total_patients || 0, icon: Users, tone: 'blue' },
          { label: 'Total Predictions', value: totalPredictions, icon: Activity, tone: 'blue' },
          { label: 'High Risk Patients', value: highRiskCount, icon: AlertTriangle, tone: 'red' },
          { label: user?.role === 'admin' ? 'Total Users' : 'Clinical Role', value: user?.role === 'admin' ? data?.total_users || 0 : user?.role || 'Doctor', icon: ShieldCheck, tone: 'blue' },
        ].map((item) => {
          const Icon = item.icon;
          const toneClass =
            item.tone === 'red'
              ? 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300'
              : 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300';

          return (
            <div key={item.label} className="clinical-card flex items-center justify-between p-6">
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">{item.label}</p>
                <p className="mt-2 text-3xl font-bold text-slate-950 dark:text-white">{item.value}</p>
              </div>
              <div className={`rounded-xl border p-3 ${toneClass}`}>
                <Icon className="h-6 w-6" />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
        {user?.role !== 'patient' && (
          <div className="clinical-panel">
            <h2 className="text-lg font-bold text-slate-950 dark:text-white">Quick Actions</h2>
            <div className="mt-5 space-y-3">
              {[
                { label: 'Find Patient', help: 'Open a patient record before launching predictions', icon: UserPlus, to: '/patients' },
                { label: 'Prediction History', help: 'Review completed diagnostic assessments', icon: Stethoscope, to: '/history' },
                { label: 'Reports', help: 'Download generated PDF reports', icon: FileText, to: '/reports' },
                { label: 'Notifications', help: 'Review backend clinical alerts', icon: ClipboardList, to: '/notifications' },
              ].map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.label}
                    onClick={() => navigate(action.to)}
                    className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-blue-300 hover:bg-blue-50 dark:border-slate-800 dark:bg-slate-950/40 dark:hover:border-blue-500/40 dark:hover:bg-blue-500/10"
                  >
                    <span className="flex items-center gap-3">
                      <span className="rounded-lg border border-blue-200 bg-white p-2 text-blue-700 dark:border-blue-500/20 dark:bg-slate-900 dark:text-blue-300">
                        <Icon className="h-5 w-5" />
                      </span>
                      <span>
                        <span className="block text-sm font-semibold text-slate-900 dark:text-slate-100">{action.label}</span>
                        <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">{action.help}</span>
                      </span>
                    </span>
                    <ChevronRight className="h-5 w-5 text-slate-400" />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className={`clinical-panel ${user?.role === 'patient' ? 'xl:col-span-2' : ''}`}>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-950 dark:text-white">Prediction Statistics</h2>
            <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Real totals</span>
          </div>
          <div className="mt-6 space-y-5">
            <div>
              <div className="flex justify-between text-sm">
                <span className="font-medium text-slate-700 dark:text-slate-300">High risk distribution</span>
                <span className="font-semibold text-rose-600 dark:text-rose-300">{highRiskPercent}%</span>
              </div>
              <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-950">
                <div className="h-full rounded-full bg-rose-600 transition-all" style={{ width: `${highRiskPercent}%` }} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                <p className="text-xs font-semibold uppercase text-slate-500">High Risk</p>
                <p className="mt-2 text-2xl font-bold text-rose-600 dark:text-rose-300">{highRiskCount}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                <p className="text-xs font-semibold uppercase text-slate-500">Other Results</p>
                <p className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">{nonHighRiskCount}</p>
              </div>
            </div>
            <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
              Distribution is derived from `/dashboard/summary`.
            </p>
          </div>
        </div>

        <div className="clinical-panel">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-950 dark:text-white">Recent Notifications</h2>
            <button onClick={() => navigate('/notifications')} className="text-xs font-semibold text-blue-700 hover:text-blue-800 dark:text-blue-300">
              View all
            </button>
          </div>
          <div className="mt-5 space-y-3">
            {notifications.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
                No notifications available.
              </div>
            ) : (
              notifications.slice(0, 4).map((notification) => (
                <div key={notification.id} className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/40">
                  <Bell className="mt-0.5 h-4 w-4 shrink-0 text-blue-700 dark:text-blue-300" />
                  <div className="min-w-0">
                    <p className="line-clamp-2 text-sm font-medium text-slate-800 dark:text-slate-200">{notification.message}</p>
                    <p className="mt-1 text-xs text-slate-500">{formatDate(notification.created_at)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="clinical-panel">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-950 dark:text-white">Recent Activity</h2>
          <button onClick={() => navigate('/history')} className="text-xs font-semibold text-blue-700 hover:text-blue-800 dark:text-blue-300">
            Prediction history
          </button>
        </div>
        {data?.recent_activity.length === 0 ? (
          <div className="mt-5 rounded-xl border border-dashed border-slate-300 py-12 text-center text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
            No recent activity recorded.
          </div>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <tr>
                  <th className="py-3 pr-4">Activity</th>
                  <th className="py-3 pr-4">Resource</th>
                  <th className="py-3 pr-4">Time</th>
                  <th className="py-3 text-right">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                {data?.recent_activity.map((activity, index) => (
                  <tr key={`${activity.resource}-${index}`}>
                    <td className="py-4 pr-4">
                      <div className="flex items-center gap-3">
                        <span className="rounded-lg border border-blue-200 bg-blue-50 p-2 dark:border-blue-500/20 dark:bg-blue-500/10">
                          {getIconForActivity(activity.type)}
                        </span>
                        <span className="font-medium text-slate-900 dark:text-slate-100">{activity.title}</span>
                      </div>
                    </td>
                    <td className="py-4 pr-4 font-mono text-xs text-slate-500">{activity.resource}</td>
                    <td className="py-4 pr-4 text-slate-500 dark:text-slate-400">{formatDate(activity.timestamp)}</td>
                    <td className="py-4 text-right">
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-semibold uppercase text-slate-500 dark:border-slate-700 dark:bg-slate-950/50">
                        {activity.type}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
