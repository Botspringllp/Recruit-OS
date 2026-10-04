'use client';

import React, { useState, useTransition } from 'react';
import {
  Bell,
  Search,
  Filter,
  CheckCheck,
  Trash2,
  Inbox,
  Briefcase,
  User,
  Send,
  ShieldAlert,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronRight
} from 'lucide-react';
import {
  getNotificationCenterAction,
  bulkMarkNotificationsReadAction,
  markAllNotificationsReadAction,
  deleteNotificationsAction
} from '@/app/actions/notificationActions';

interface NotificationsClientProps {
  initialNotifications: any[];
  initialTotalCount: number;
  initialUnreadCount: number;
}

export function NotificationsClient({
  initialNotifications,
  initialTotalCount,
  initialUnreadCount
}: NotificationsClientProps) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);

  const [category, setCategory] = useState<'ALL' | 'UNREAD' | 'REQUIREMENTS' | 'CANDIDATES' | 'INTERVIEWS' | 'SYSTEM'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  const handleFilterChange = (newCategory: any) => {
    setCategory(newCategory);
    setSelectedIds([]);
    startTransition(async () => {
      const res = await getNotificationCenterAction({ category: newCategory, searchQuery });
      if (res.success) {
        setNotifications(res.notifications);
        setTotalCount(res.totalCount);
        setUnreadCount(res.unreadCount);
      }
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSelectedIds([]);
    startTransition(async () => {
      const res = await getNotificationCenterAction({ category, searchQuery });
      if (res.success) {
        setNotifications(res.notifications);
        setTotalCount(res.totalCount);
        setUnreadCount(res.unreadCount);
      }
    });
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(notifications.map((n) => n.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleMarkSelectedRead = () => {
    if (selectedIds.length === 0) return;
    startTransition(async () => {
      await bulkMarkNotificationsReadAction(selectedIds);
      setNotifications((prev) =>
        prev.map((n) => (selectedIds.includes(n.id) ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - selectedIds.length));
      setSelectedIds([]);
    });
  };

  const handleMarkAllRead = () => {
    startTransition(async () => {
      await markAllNotificationsReadAction();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      setSelectedIds([]);
    });
  };

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    startTransition(async () => {
      await deleteNotificationsAction(selectedIds);
      setNotifications((prev) => prev.filter((n) => !selectedIds.includes(n.id)));
      setTotalCount((prev) => Math.max(0, prev - selectedIds.length));
      setSelectedIds([]);
    });
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'REQUIREMENT':
        return <Inbox className="h-4 w-4 text-amber-600" />;
      case 'JOB_MANDATE':
        return <Briefcase className="h-4 w-4 text-blue-600" />;
      case 'CANDIDATE':
        return <User className="h-4 w-4 text-emerald-600" />;
      case 'SUBMISSION':
        return <Send className="h-4 w-4 text-purple-600" />;
      case 'SUBSCRIPTION':
        return <ShieldAlert className="h-4 w-4 text-red-600" />;
      default:
        return <Bell className="h-4 w-4 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 border border-indigo-800/40 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Bell className="h-6 w-6 text-amber-400" />
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Notification Center
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 font-semibold max-w-2xl leading-relaxed">
            Real-time event stream (PHASE NT-02). Filter, search, process bulk read actions, or review system alerts.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleMarkAllRead}
            disabled={isPending || unreadCount === 0}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl text-xs shadow-md transition-all disabled:opacity-50"
          >
            <CheckCheck className="h-4 w-4 text-emerald-400" />
            <span>Mark All Read ({unreadCount})</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Category Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'ALL', label: 'All', count: totalCount },
              { id: 'UNREAD', label: 'Unread', count: unreadCount },
              { id: 'REQUIREMENTS', label: 'Requirements' },
              { id: 'CANDIDATES', label: 'Candidates' },
              { id: 'INTERVIEWS', label: 'Interviews' },
              { id: 'SYSTEM', label: 'System' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleFilterChange(tab.id)}
                className={`px-3.5 py-2 rounded-2xl text-xs font-black transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  category === tab.id
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${category === tab.id ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-200 text-slate-700'}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="flex items-center gap-2 w-full lg:w-72">
            <div className="relative w-full">
              <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </form>
        </div>

        {/* Bulk Action Controls Bar */}
        {selectedIds.length > 0 && (
          <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-2xl flex items-center justify-between text-xs font-extrabold text-indigo-950 animate-in fade-in">
            <span>{selectedIds.length} notification(s) selected</span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleMarkSelectedRead}
                disabled={isPending}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all"
              >
                Mark Read
              </button>
              <button
                onClick={handleDeleteSelected}
                disabled={isPending}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Notifications List Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-black text-slate-600">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={selectedIds.length > 0 && selectedIds.length === notifications.length}
              onChange={handleSelectAll}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
            />
            <span>Notification Stream</span>
          </div>
          <span>Showing {notifications.length} of {totalCount}</span>
        </div>

        <div className="divide-y divide-slate-100">
          {notifications.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Bell className="h-10 w-10 text-slate-300 mx-auto" />
              <h3 className="font-extrabold text-slate-700 text-sm">No notifications found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No notifications match your current filter or search criteria. Real-time events will stream here as actions occur.
              </p>
            </div>
          ) : (
            notifications.map((notif) => {
              const isSelected = selectedIds.includes(notif.id);

              return (
                <div
                  key={notif.id}
                  className={`p-4 transition-all flex items-start gap-3.5 ${
                    !notif.isRead ? 'bg-amber-50/50 hover:bg-amber-100/60' : 'bg-white hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleToggleSelect(notif.id)}
                    className="mt-1 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                  />

                  <div className="p-2.5 rounded-2xl bg-white border border-slate-200 shadow-2xs shrink-0 mt-0.5">
                    {getCategoryIcon(notif.category)}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <h4 className={`text-xs ${!notif.isRead ? 'font-black text-slate-900' : 'font-extrabold text-slate-700'}`}>
                          {notif.title}
                        </h4>
                        <span className="px-2 py-0.2 rounded-full text-[9px] font-black uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                          {notif.category}
                        </span>
                      </div>

                      <span className="text-[10px] text-slate-400 font-semibold shrink-0 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(notif.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      {notif.message}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
