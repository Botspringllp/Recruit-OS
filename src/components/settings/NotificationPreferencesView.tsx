'use client';

import React, { useState, useTransition } from 'react';
import {
  Bell,
  Mail,
  Smartphone,
  Calendar,
  User,
  Inbox,
  ShieldAlert,
  Activity,
  CheckCircle2,
  Save,
  BarChart3,
  Eye,
  MousePointer
} from 'lucide-react';
import { updateUserNotificationPreferencesAction } from '@/app/actions/notificationActions';

interface AnalyticsData {
  totalNotifs: number;
  deliveredCount: number;
  viewedCount: number;
  clickedCount: number;
  deliveryRate: number;
  readRate: number;
}

interface NotificationPreferencesViewProps {
  initialPreferences: any;
  analytics: AnalyticsData;
}

export function NotificationPreferencesView({
  initialPreferences,
  analytics
}: NotificationPreferencesViewProps) {
  const [prefs, setPrefs] = useState({
    emailNotifications: initialPreferences?.emailNotifications ?? true,
    inAppNotifications: initialPreferences?.inAppNotifications ?? true,
    interviewNotifications: initialPreferences?.interviewNotifications ?? true,
    candidateNotifications: initialPreferences?.candidateNotifications ?? true,
    requirementNotifications: initialPreferences?.requirementNotifications ?? true,
    systemNotifications: initialPreferences?.systemNotifications ?? true
  });

  const [isPending, startTransition] = useTransition();
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleToggle = (key: keyof typeof prefs) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    setNotification(null);
    startTransition(async () => {
      const res = await updateUserNotificationPreferencesAction(prefs);
      if (res.success) {
        setNotification({ type: 'success', message: 'Notification preferences updated successfully!' });
      } else {
        setNotification({ type: 'error', message: res.error || 'Failed to update notification preferences.' });
      }
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 border border-indigo-800/40 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Bell className="h-6 w-6 text-amber-400" />
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Notification Preferences & Analytics
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 font-semibold max-w-2xl leading-relaxed">
            Configure real-time event alerts (PHASE NT-02). Customize in-app, email, and workflow category notifications, and view delivery metrics.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={isPending}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black rounded-2xl text-xs sm:text-sm shadow-lg shadow-amber-500/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 shrink-0"
        >
          <Save className="h-4 w-4" />
          <span>{isPending ? 'Saving...' : 'Save Preferences'}</span>
        </button>
      </div>

      {notification && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
              : 'bg-rose-50 text-rose-900 border-rose-300'
          }`}
        >
          <CheckCircle2 className="h-4 w-4" />
          <span>{notification.message}</span>
        </div>
      )}

      {/* Part H: Delivery Analytics Metrics Dashboard */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-indigo-600" />
            Notification Delivery Analytics (Part H)
          </h2>
          <span className="text-xs text-slate-400 font-bold">Real-Time Tracking</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Total Dispatched</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{analytics.totalNotifs}</div>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200">
            <span className="text-[10px] font-black uppercase text-emerald-700 tracking-wider flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Delivery Rate
            </span>
            <div className="text-2xl font-black text-emerald-950 mt-1">{analytics.deliveryRate}%</div>
            <div className="text-[10px] text-emerald-800 font-bold">{analytics.deliveredCount} delivered</div>
          </div>

          <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200">
            <span className="text-[10px] font-black uppercase text-sky-700 tracking-wider flex items-center gap-1">
              <Eye className="h-3 w-3" /> Read / View Rate
            </span>
            <div className="text-2xl font-black text-sky-950 mt-1">{analytics.readRate}%</div>
            <div className="text-[10px] text-sky-800 font-bold">{analytics.viewedCount} viewed</div>
          </div>

          <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200">
            <span className="text-[10px] font-black uppercase text-purple-700 tracking-wider flex items-center gap-1">
              <MousePointer className="h-3 w-3" /> Click Interaction
            </span>
            <div className="text-2xl font-black text-purple-950 mt-1">{analytics.clickedCount}</div>
            <div className="text-[10px] text-purple-800 font-bold">direct engagements</div>
          </div>
        </div>
      </div>

      {/* Part G: Preferences Settings Toggles */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
        <h2 className="text-base font-black text-slate-900 border-b border-slate-100 pb-3">
          Category & Channel Controls
        </h2>

        <div className="space-y-4 divide-y divide-slate-100">
          {/* Channel Toggles */}
          <div className="pt-2 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Delivery Channels</h3>

            <div className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
                  <Smartphone className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900">In-App Live SSE Notifications</h4>
                  <p className="text-[11px] text-slate-500">Real-time toasts and notification bell dropdown streaming</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={prefs.inAppNotifications}
                onChange={() => handleToggle('inAppNotifications')}
                className="h-5 w-5 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-sky-100 text-sky-800">
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900">Email Alerts</h4>
                  <p className="text-[11px] text-slate-500">Receive backup email summaries for urgent workflow events</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={prefs.emailNotifications}
                onChange={() => handleToggle('emailNotifications')}
                className="h-5 w-5 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Workflow Categories */}
          <div className="pt-4 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Workflow Events</h3>

            <div className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-100 text-blue-800">
                  <Calendar className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900">Interview Notifications</h4>
                  <p className="text-[11px] text-slate-500">Client invites, slot selections, prep kit completion, outcomes</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={prefs.interviewNotifications}
                onChange={() => handleToggle('interviewNotifications')}
                className="h-5 w-5 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900">Candidate & Submission Notifications</h4>
                  <p className="text-[11px] text-slate-500">Candidate additions, client review submissions, feedback</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={prefs.candidateNotifications}
                onChange={() => handleToggle('candidateNotifications')}
                className="h-5 w-5 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-purple-100 text-purple-800">
                  <Inbox className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900">Requirement Notifications</h4>
                  <p className="text-[11px] text-slate-500">New client requirement assignments and mandate status updates</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={prefs.requirementNotifications}
                onChange={() => handleToggle('requirementNotifications')}
                className="h-5 w-5 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-red-100 text-red-800">
                  <ShieldAlert className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900">System & Subscription Notifications</h4>
                  <p className="text-[11px] text-slate-500">Subscription renewal alerts, security warnings, system notices</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={prefs.systemNotifications}
                onChange={() => handleToggle('systemNotifications')}
                className="h-5 w-5 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
