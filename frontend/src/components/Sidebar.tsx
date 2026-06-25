import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  History, 
  ShieldCheck, 
  HeartPulse, 
  Activity,
  LogOut,
  Bell,
  PlusCircle,
  FileText,
  UserRound,
  Settings
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../store';
import { logoutUser } from '../store/slices/authSlice';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();

  const handleLogout = () => {
    dispatch(logoutUser());
  };

  const navItems = [
    {
      to: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      allowedRoles: ['admin', 'doctor', 'patient'],
    },
    {
      to: '/patients',
      label: 'Patients',
      icon: Users,
      allowedRoles: ['admin', 'doctor'],
    },
    {
      to: '/patients',
      label: 'Add Patient',
      icon: PlusCircle,
      allowedRoles: ['admin', 'doctor'],
    },
    {
      to: '/predict/diabetes',
      label: 'Diabetes Prediction',
      icon: Activity,
      allowedRoles: ['admin', 'doctor'],
    },
    {
      to: '/predict/pcos',
      label: 'PCOS Prediction (Prepared)',
      icon: HeartPulse,
      allowedRoles: ['admin', 'doctor'],
    },
    {
      to: '/history',
      label: 'Prediction History',
      icon: History,
      allowedRoles: ['admin', 'doctor', 'patient'],
    },
    {
      to: '/history',
      label: 'Reports (PDF)',
      icon: FileText,
      allowedRoles: ['admin', 'doctor', 'patient'],
    },
    {
      to: '/notifications',
      label: 'Notifications',
      icon: Bell,
      allowedRoles: ['admin', 'doctor', 'patient'],
    },
    {
      to: '/admin',
      label: 'Admin Control',
      icon: ShieldCheck,
      allowedRoles: ['admin'],
    },
  ];

  const filteredItems = navItems.filter(
    (item) => user && item.allowedRoles.includes(user.role)
  );

  const accountItems = [
    { label: 'Profile', icon: UserRound, description: user?.email || 'Signed in user' },
    { label: 'Settings', icon: Settings, description: 'Theme and account controls' },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200 bg-white text-slate-700 transition-transform duration-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-6 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-600/20">
              <HeartPulse className="h-6 w-6" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-950 dark:text-white">
              MedPredict
            </span>
          </div>
        </div>

        <div className="border-b border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-800/50 dark:bg-slate-950/20">
          <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Care workspace</p>
          <p className="mt-1 truncate text-sm font-medium text-slate-900 dark:text-slate-100">{user?.email}</p>
          <span className="mt-2 inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-medium capitalize text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
            {user?.role}
          </span>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-6">
          <p className="px-4 pb-2 text-[10px] font-semibold uppercase text-slate-400">Clinical Navigation</p>
          <div className="space-y-1">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-medium transition ${
                    isActive && !['Add Patient', 'Reports (PDF)'].includes(item.label)
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-100'
                  }`
                }
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </NavLink>
            );
          })}
          </div>

          <p className="px-4 pb-2 pt-6 text-[10px] font-semibold uppercase text-slate-400">Account</p>
          <div className="space-y-1">
            {accountItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  type="button"
                  title={`${item.label}: ${item.description}`}
                  className="flex w-full items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-100"
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Footer Logout */}
        <div className="border-t border-slate-200 p-4 dark:border-slate-800">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-medium text-rose-600 transition hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
