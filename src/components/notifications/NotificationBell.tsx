'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Bell,
  Inbox,
  Briefcase,
  User,
  Send,
  ShieldAlert,
  CheckCheck,
  ChevronRight,
  Clock,
  Wifi,
  WifiOff
} from 'lucide-react';
import { useNotificationToast } from './NotificationToastProvider';

export interface NotificationItem {
  id: string;
  agencyId?: string | null;
  recipientUserId: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  category: 'REQUIREMENT' | 'JOB_MANDATE' | 'CANDIDATE' | 'SUBMISSION' | 'SYSTEM' | 'SUBSCRIPTION';
  entityType?: string | null;
  entityId?: string | null;
  isRead: boolean;
  createdAt: string;
}

export const NotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSseConnected, setIsSseConnected] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Access Toast Provider
  let toastApi: { addToast: (t: any) => void } | null = null;
  try {
    toastApi = useNotificationToast();
  } catch (err) {
    // Fallback if rendered outside provider
  }

  const fetchInitialNotifications = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/notifications?limit=6');
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to fetch initial notifications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // PART D: Connect to Real-Time SSE Notification Stream (/api/notifications/stream)
  useEffect(() => {
    fetchInitialNotifications();

    let eventSource: EventSource | null = null;

    const setupSseConnection = () => {
      eventSource = new EventSource('/api/notifications/stream');

      eventSource.addEventListener('connected', () => {
        setIsSseConnected(true);
      });

      eventSource.addEventListener('notification', (event: MessageEvent) => {
        try {
          const newNotif: NotificationItem = JSON.parse(event.data);
          
          setNotifications((prev) => {
            const exists = prev.some((n) => n.id === newNotif.id);
            if (exists) return prev;
            return [newNotif, ...prev].slice(0, 8);
          });

          setUnreadCount((prev) => prev + 1);

          // Trigger Live Toast Notification
          if (toastApi) {
            toastApi.addToast({
              title: newNotif.title,
              message: newNotif.message,
              type: newNotif.type || 'INFO'
            });
          }
        } catch (err) {
          console.error('Failed parsing SSE notification payload:', err);
        }
      });

      eventSource.onerror = () => {
        setIsSseConnected(false);
        if (eventSource) {
          eventSource.close();
        }
        // Auto-reconnect after 5 seconds
        setTimeout(setupSseConnection, 5000);
      };
    };

    setupSseConnection();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

    setIsOpen(false);

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

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'SUCCESS':
        return <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />;
      case 'WARNING':
        return <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />;
      case 'ERROR':
        return <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />;
      default:
        return <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />;
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-slate-600 hover:text-slate-950 hover:bg-slate-100 transition-colors focus:outline-none"
        aria-label="Notifications Center"
      >
        <Bell className="h-5 w-5" />

        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 min-w-4 px-1 items-center justify-center bg-amber-600 text-[9px] font-black text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-3xl border border-slate-200 shadow-2xl z-50 overflow-hidden animate-in fade-in duration-200">
          {/* Dropdown Header */}
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-amber-400" />
              <h3 className="font-extrabold text-xs tracking-wider uppercase">Notifications</h3>
              
              {/* SSE Connection Status Pill */}
              <span
                className={`text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 border ${
                  isSseConnected
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                }`}
              >
                {isSseConnected ? (
                  <>
                    <Wifi className="h-2.5 w-2.5 text-emerald-400" /> LIVE SSE
                  </>
                ) : (
                  <>
                    <WifiOff className="h-2.5 w-2.5 text-amber-400" /> RECONNECTING
                  </>
                )}
              </span>
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[11px] font-bold text-slate-300 hover:text-amber-400 flex items-center gap-1 transition-colors"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 text-xs">
            {notifications.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <Bell className="h-8 w-8 text-slate-300 mx-auto" />
                <p className="font-bold text-slate-500">No notifications yet</p>
                <p className="text-[11px] text-slate-400">All real-time workflow events will stream instantly here.</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-3.5 transition-all cursor-pointer flex gap-3 items-start ${
                    !notif.isRead
                      ? 'bg-amber-50/60 hover:bg-amber-100/70 border-l-4 border-l-amber-500'
                      : 'bg-white hover:bg-slate-50 text-slate-600 border-l-4 border-l-transparent'
                  }`}
                >
                  <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-2xs shrink-0 mt-0.5">
                    {getCategoryIcon(notif.category)}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {getTypeBadge(notif.type)}
                        <h4 className={`text-xs truncate ${!notif.isRead ? 'font-black text-slate-900' : 'font-extrabold text-slate-700'}`}>
                          {notif.title}
                        </h4>
                      </div>
                      <span className="text-[10px] text-slate-400 font-semibold shrink-0 flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />
                        {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Dropdown Footer */}
          <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
            <Link
              href="/notifications"
              onClick={() => setIsOpen(false)}
              className="text-xs font-black text-amber-700 hover:text-amber-800 flex items-center justify-center gap-1 transition-colors"
            >
              <span>Open Notification Center</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
