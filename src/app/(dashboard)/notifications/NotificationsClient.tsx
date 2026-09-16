'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Bell,
  Search,
  Filter,
  CheckCheck,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Briefcase,
  User,
  Send,
  ShieldAlert,
  Clock,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { NotificationItem } from '@/components/notifications/NotificationBell';

const CATEGORIES = [
  { label: 'All Categories', value: 'ALL' },
  { label: 'Requirements', value: 'REQUIREMENT' },
  { label: 'Job Mandates', value: 'JOB_MANDATE' },
  { label: 'Candidates', value: 'CANDIDATE' },
  { label: 'Submissions', value: 'SUBMISSION' },
  { label: 'System', value: 'SYSTEM' },
  { label: 'Subscription', value: 'SUBSCRIPTION' }
];

export function NotificationsClient() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [page, setPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UNREAD' | 'READ'>('ALL');

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        category: selectedCategory,
        q: searchQuery
      });

      if (statusFilter === 'UNREAD') {
        queryParams.set('unreadOnly', 'true');
      }

      const res = await fetch(`/api/notifications?${queryParams.toString()}`);
      const data = await res.json();

      if (data.success) {
        let fetchedList: NotificationItem[] = data.notifications || [];

        // Apply client-side read status filter if READ selected
        if (statusFilter === 'READ') {
          fetchedList = fetchedList.filter((n) => n.isRead);
        }

        setNotifications(fetchedList);
        setUnreadCount(data.unreadCount || 0);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed loading notifications page:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [page, selectedCategory, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchNotifications();
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true })
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleClearRead = async () => {
    if (!confirm('Are you sure you want to clear all read notifications?')) return;
    try {
      const res = await fetch('/api/notifications?clearRead=true', {
        method: 'DELETE'
      });
      if (res.ok) {
        setNotifications((prev) => prev.filter((n) => !n.isRead));
        fetchNotifications();
      }
    } catch (err) {
      console.error('Failed to clear read notifications:', err);
    }
  };

  const handleNotificationClick = async (notif: NotificationItem) => {
    if (!notif.isRead) {
      try {
        await fetch('/api/notifications', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notificationId: notif.id })
        });
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.error('Failed to mark notification as read:', err);
      }
    }

    let targetUrl = '/notifications';
    if (notif.entityType === 'REQUIREMENT' && notif.entityId) {
      targetUrl = `/incoming-requirements/${notif.entityId}`;
    } else if (notif.entityType === 'JOB_MANDATE' && notif.entityId) {
      targetUrl = `/jobs/${notif.entityId}`;
    } else if (notif.entityType === 'CANDIDATE' && notif.entityId) {
      targetUrl = `/candidates/${notif.entityId}`;
    } else if (notif.entityType === 'SUBMISSION' && notif.entityId) {
      targetUrl = `/submissions`;
    }

    window.location.href = targetUrl;
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'REQUIREMENT':
        return <Inbox className="h-5 w-5 text-amber-600" />;
      case 'JOB_MANDATE':
        return <Briefcase className="h-5 w-5 text-blue-600" />;
      case 'CANDIDATE':
        return <User className="h-5 w-5 text-emerald-600" />;
      case 'SUBMISSION':
        return <Send className="h-5 w-5 text-purple-600" />;
      case 'SUBSCRIPTION':
        return <ShieldAlert className="h-5 w-5 text-red-600" />;
      default:
        return <Bell className="h-5 w-5 text-slate-500" />;
    }
  };

  const getTypeStyle = (type: string) => {
    switch (type) {
      case 'SUCCESS':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'WARNING':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'ERROR':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-2 max-w-xl z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-black uppercase tracking-wider">
            <Bell className="h-3.5 w-3.5" /> Platform Notification Center
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">System & Workflow Alerts</h1>
          <p className="text-xs md:text-sm text-slate-400">
            Real-time audit history of incoming requirements, mandate updates, recruiter assignments, and agency system alerts.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 z-10 shrink-0">
          <button
            type="button"
            onClick={fetchNotifications}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5"
            >
              <CheckCheck className="h-4 w-4" />
              Mark All Read ({unreadCount})
            </button>
          )}

          <button
            type="button"
            onClick={handleClearRead}
            className="px-3.5 py-2 bg-slate-800 hover:bg-red-900/50 text-slate-300 hover:text-red-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear Read
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[240px] max-w-md relative">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white transition-all"
            />
          </form>

          <div className="flex flex-wrap items-center gap-2">
            {/* Category Dropdown */}
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
              <Filter className="h-3.5 w-3.5 text-slate-400" />
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Read/Unread Filter */}
            <div className="flex items-center p-1 bg-slate-100 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('ALL');
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  statusFilter === 'ALL'
                    ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('UNREAD');
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  statusFilter === 'UNREAD'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Unread ({unreadCount})
              </button>
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('READ');
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  statusFilter === 'READ'
                    ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Read
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications List Grid */}
      {isLoading ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
          <RefreshCw className="h-8 w-8 text-amber-500 animate-spin mx-auto mb-2" />
          <p className="text-xs font-bold text-slate-600">Loading notification stream...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
          <Bell className="h-10 w-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-black text-slate-800">No Notifications Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {statusFilter === 'UNREAD'
              ? 'You have caught up with all your notifications!'
              : 'No notifications match your current filter parameters.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleNotificationClick(notif)}
              className={`p-5 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-4 ${
                !notif.isRead
                  ? 'bg-amber-50/70 border-amber-300 shadow-xs hover:border-amber-400'
                  : 'bg-white border-slate-200 hover:border-slate-300 text-slate-600'
              }`}
            >
              <div className="flex items-start gap-4 flex-1 min-w-0">
                <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs shrink-0">
                  {getCategoryIcon(notif.category)}
                </div>

                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className={`text-sm ${!notif.isRead ? 'font-black text-slate-900' : 'font-bold text-slate-700'}`}>
                      {notif.title}
                    </h3>

                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${getTypeStyle(notif.type)}`}>
                      {notif.type}
                    </span>

                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 uppercase border border-slate-200">
                      {notif.category}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed font-normal">
                    {notif.message}
                  </p>

                  <div className="pt-1 flex items-center gap-4 text-[11px] text-slate-400 font-semibold">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-slate-400" />
                      {new Date(notif.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 pt-1">
                <span className="text-xs font-bold text-amber-700 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  View Context
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 text-xs font-bold">
          <span className="text-slate-500">
            Page {page} of {totalPages} ({total} total alerts)
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded-xl text-slate-800 transition-all flex items-center gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>

            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded-xl text-slate-800 transition-all flex items-center gap-1"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
