import React, { useState, useEffect, useRef } from 'react';
import { Bell, Menu, CheckCircle, Moon, Sun } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../store';
import { fetchNotifications, markNotificationAsRead } from '../store/slices/notificationSlice';

interface NavbarProps {
  onMenuClick: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onMenuClick }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('medpredict-theme') === 'dark';
  });
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const dispatch = useAppDispatch();
  const { items: notifications, unreadCount } = useAppSelector((state) => state.notifications);
  const { user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    // Initial fetch of notifications
    if (user) {
      dispatch(fetchNotifications({ limit: 5 }));
    }
  }, [dispatch, user]);

  // Handle clicking outside to close the dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('medpredict-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const handleMarkRead = (id: string) => {
    dispatch(markNotificationAsRead(id));
  };

  // Helper to format date
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-900 sm:px-6">
      <button
        onClick={onMenuClick}
        className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 lg:hidden"
        aria-label="Open navigation"
      >
        <Menu className="h-6 w-6" />
      </button>

      <div className="hidden sm:block">
        <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
          Clinical decision support platform
        </span>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setDarkMode((value) => !value)}
          className="theme-toggle"
          aria-label="Toggle color theme"
          title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          <span className="theme-toggle-thumb">
            {darkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </span>
        </button>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="relative rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-blue-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-blue-300"
            aria-label="Open notifications"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notification List Dropdown Panel */}
          {dropdownOpen && (
            <div className="absolute right-0 z-50 mt-3 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/80 dark:border-slate-800 dark:bg-slate-900 dark:shadow-slate-950/50">
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">Alert Center</span>
                {unreadCount > 0 && (
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {unreadCount} unread
                  </span>
                )}
              </div>

              {/* Notification rows */}
              <div className="max-h-64 divide-y divide-slate-100 overflow-y-auto dark:divide-slate-800/50">
                {notifications.length === 0 ? (
                  <div className="px-4 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
                    No notifications available
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div 
                      key={notif.id} 
                      className={`flex gap-3 p-3.5 transition-colors ${
                        notif.is_read ? 'bg-white dark:bg-slate-900/40' : 'bg-blue-50 hover:bg-blue-100/70 dark:bg-blue-500/5 dark:hover:bg-blue-500/10'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs text-slate-700 dark:text-slate-300 ${!notif.is_read ? 'font-medium' : ''}`}>
                          {notif.message}
                        </p>
                        <span className="mt-1 block text-[10px] text-slate-500">
                          {formatTime(notif.created_at)}
                        </span>
                      </div>
                      {!notif.is_read && (
                        <button
                          onClick={() => handleMarkRead(notif.id)}
                          className="self-center rounded-md p-1 text-slate-500 transition-colors hover:text-blue-600 dark:hover:text-blue-300"
                          title="Mark as read"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Vertical Divider */}
        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />

        <div className="flex items-center gap-3">
          <div className="hidden md:flex flex-col text-right">
            <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Signed in</span>
            <span className="max-w-40 truncate text-sm font-medium text-slate-900 dark:text-slate-100">{user?.email}</span>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold capitalize text-white">
            {user?.email[0] || 'U'}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
