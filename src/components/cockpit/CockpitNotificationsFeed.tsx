'use client';

import React from 'react';
import Link from 'next/link';
import { Bell, Check, ArrowRight, Info, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

export interface CockpitNotificationItem {
  id: string;
  title: string;
  message: string;
  type: string; // INFO, SUCCESS, WARNING, ERROR
  category: string; // REQUIREMENT, JOB_MANDATE, CANDIDATE, SUBMISSION, SYSTEM
  entityType?: string | null;
  entityId?: string | null;
  isRead: boolean;
  createdAt: string;
}

interface CockpitNotificationsFeedProps {
  notifications: CockpitNotificationItem[];
  onMarkRead?: (id: string) => void;
}

export const CockpitNotificationsFeed: React.FC<CockpitNotificationsFeedProps> = ({
  notifications,
  onMarkRead
}) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'SUCCESS':
        return <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />;
      case 'WARNING':
        return <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />;
      case 'ERROR':
        return <XCircle className="h-4 w-4 text-rose-600 shrink-0" />;
      default:
        return <Info className="h-4 w-4 text-indigo-600 shrink-0" />;
    }
  };

  const getEntityHref = (category: string, entityType?: string | null, entityId?: string | null) => {
    if (!entityId) return '/notifications';
    if (category === 'REQUIREMENT' || entityType === 'REQUIREMENT') {
      return `/incoming-requirements/${entityId}`;
    }
    if (category === 'JOB_MANDATE' || entityType === 'JOB_MANDATE') {
      return `/jobs/${entityId}`;
    }
    if (category === 'CANDIDATE' || entityType === 'CANDIDATE') {
      return `/candidates/${entityId}`;
    }
    if (category === 'SUBMISSION' || entityType === 'SUBMISSION') {
      return `/submissions/${entityId}`;
    }
    return '/notifications';
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-purple-50 border border-purple-200 text-purple-600">
            <Bell className="h-4.5 w-4.5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 tracking-tight">Recruiter Notification Stream</h3>
            <p className="text-[11px] text-slate-600 font-semibold">
              Live NT-01 notification feed for assignments, client feedback & candidate status updates
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <span className="px-2.5 py-0.5 text-[10px] font-extrabold rounded-full bg-indigo-100 text-indigo-950 border border-indigo-300">
              {unreadCount} Unread
            </span>
          )}
          <Link
            href="/notifications"
            className="text-[11px] font-extrabold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-1">
          <Bell className="h-6 w-6 text-slate-400 mx-auto" />
          <h4 className="text-xs font-black text-slate-900">Notification Feed Clear</h4>
          <p className="text-[11px] text-slate-500 font-medium">
            You are all caught up with your candidate submissions and requirement assignments.
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {notifications.slice(0, 5).map((n) => {
            const href = getEntityHref(n.category, n.entityType, n.entityId);

            return (
              <div
                key={n.id}
                className={`p-3 rounded-xl border text-xs transition-all flex items-start justify-between gap-3 ${
                  n.isRead ? 'bg-slate-50/60 border-slate-200 text-slate-700' : 'bg-indigo-50/40 border-indigo-200 text-slate-900 font-semibold'
                }`}
              >
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  <div className="mt-0.5">{getIcon(n.type)}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Link href={href} className="font-extrabold hover:text-indigo-600 transition-colors truncate">
                        {n.title}
                      </Link>
                      <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-slate-200/70 text-slate-700 uppercase shrink-0">
                        {n.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5">
                      {n.message}
                    </p>
                    <span className="text-[9px] text-slate-400 font-bold block mt-1">
                      {new Date(n.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} • {new Date(n.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>

                {!n.isRead && onMarkRead && (
                  <button
                    onClick={() => onMarkRead(n.id)}
                    className="p-1 rounded-md bg-white hover:bg-slate-100 text-slate-500 border border-slate-200 shrink-0 transition-colors"
                    title="Mark as Read"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
