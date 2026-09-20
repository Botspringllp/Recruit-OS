'use client';

import React, { useState } from 'react';
import {
  Mail,
  Send,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Settings,
  ShieldAlert,
  Sparkles,
  X,
  FileText,
  Code,
  Laptop,
  Smartphone,
  RotateCw
} from 'lucide-react';
import { updateAgencyEmailIdentityAction } from '@/app/actions/emailIdentity';
import { retryEmailLogAction } from '@/app/actions/emailSmtpActions';
import { useRouter } from 'next/navigation';

export interface EmailLogItem {
  id: string;
  agencyId: string | null;
  eventType: string;
  recipientEmail: string;
  subject: string;
  htmlBody?: string | null;
  textBody?: string | null;
  status: 'PENDING' | 'SENT' | 'FAILED';
  errorMessage?: string | null;
  metadata?: string | null;
  createdAt: string;
  sentAt?: string | null;
}

export interface AgencyIdentityData {
  id: string;
  name: string;
  senderName?: string | null;
  replyToEmail?: string | null;
}

export interface EmailLogsClientProps {
  initialLogs: EmailLogItem[];
  agencyIdentity?: AgencyIdentityData | null;
  userRole: string;
  hideHeaderBanner?: boolean;
}

export const EmailLogsClient: React.FC<EmailLogsClientProps> = ({
  initialLogs,
  agencyIdentity,
  userRole,
  hideHeaderBanner = false
}) => {
  const router = useRouter();
  const [logs, setLogs] = useState<EmailLogItem[]>(initialLogs);
  const [searchTerm, setSearchTerm] = useState('');
  const [eventFilter, setEventFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedLog, setSelectedLog] = useState<EmailLogItem | null>(null);

  // Email Preview & Error Modal state
  const [previewLog, setPreviewLog] = useState<EmailLogItem | null>(null);
  const [inspectingErrorLog, setInspectingErrorLog] = useState<EmailLogItem | null>(null);
  const [previewTab, setPreviewTab] = useState<'html' | 'text' | 'json'>('html');
  const [viewportMode, setViewportMode] = useState<'desktop' | 'mobile'>('desktop');

  // Agency Identity Settings state
  const [isIdentityModalOpen, setIsIdentityModalOpen] = useState(false);
  const [senderName, setSenderName] = useState(agencyIdentity?.senderName || '');
  const [replyToEmail, setReplyToEmail] = useState(agencyIdentity?.replyToEmail || '');
  const [isSavingIdentity, setIsSavingIdentity] = useState(false);
  const [identitySuccess, setIdentitySuccess] = useState<string | null>(null);
  const [identityError, setIdentityError] = useState<string | null>(null);

  // Email Retry State
  const [retryingLogId, setRetryingLogId] = useState<string | null>(null);
  const [retryNotification, setRetryNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleRetryEmail = async (logId: string) => {
    setRetryingLogId(logId);
    setRetryNotification(null);

    const res = await retryEmailLogAction(logId);
    setRetryingLogId(null);

    if (res.success) {
      setRetryNotification({
        type: 'success',
        message: res.message || 'Email resent successfully!'
      });
      setLogs(prev => prev.map(l => l.id === logId ? { ...l, status: 'SENT', sentAt: new Date().toISOString(), errorMessage: null } : l));
      if (selectedLog && selectedLog.id === logId) {
        setSelectedLog(prev => prev ? { ...prev, status: 'SENT', sentAt: new Date().toISOString(), errorMessage: null } : null);
      }
      if (previewLog && previewLog.id === logId) {
        setPreviewLog(prev => prev ? { ...prev, status: 'SENT', sentAt: new Date().toISOString(), errorMessage: null } : null);
      }
      router.refresh();
    } else {
      setRetryNotification({
        type: 'error',
        message: res.error || 'Failed to resend email.'
      });
    }
  };

  // Sync state with props
  React.useEffect(() => {
    setLogs(initialLogs);
  }, [initialLogs]);

  // Statistics
  const totalCount = logs.length;
  const pendingCount = logs.filter(l => l.status === 'PENDING').length;
  const sentCount = logs.filter(l => l.status === 'SENT').length;
  const failedCount = logs.filter(l => l.status === 'FAILED').length;

  // Filtered Logs
  const filteredLogs = logs.filter(log => {
    if (eventFilter !== 'ALL' && log.eventType !== eventFilter) return false;
    if (statusFilter !== 'ALL' && log.status !== statusFilter) return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchSubject = log.subject.toLowerCase().includes(q);
      const matchRecipient = log.recipientEmail.toLowerCase().includes(q);
      const matchEvent = log.eventType.toLowerCase().includes(q);
      return matchSubject || matchRecipient || matchEvent;
    }

    return true;
  });

  const handleSaveIdentity = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingIdentity(true);
    setIdentitySuccess(null);
    setIdentityError(null);

    const res = await updateAgencyEmailIdentityAction({ senderName, replyToEmail });
    setIsSavingIdentity(false);

    if (res.success) {
      setIdentitySuccess('Agency Email Identity settings saved successfully!');
      setTimeout(() => setIsIdentityModalOpen(false), 1200);
      router.refresh();
    } else {
      setIdentityError(res.error || 'Failed to save email identity.');
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'SENT':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-black rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-3.5 w-3.5" />
            SENT
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-black rounded-full bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle className="h-3.5 w-3.5" />
            FAILED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-black rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="h-3.5 w-3.5" />
            PENDING
          </span>
        );
    }
  };

  const renderEventTypeBadge = (eventType: string) => {
    let colorClass = 'bg-slate-100 text-slate-700 border-slate-200';

    if (eventType === 'SMTP_TEST') {
      colorClass = 'bg-purple-50 text-purple-700 border-purple-200';
    } else if (eventType.includes('REQUIREMENT')) {
      colorClass = 'bg-blue-50 text-blue-700 border-blue-200';
    } else if (eventType.includes('CANDIDATE')) {
      colorClass = 'bg-purple-50 text-purple-700 border-purple-200';
    } else if (eventType.includes('CLIENT')) {
      colorClass = 'bg-indigo-50 text-indigo-700 border-indigo-200';
    } else if (eventType.includes('SUBSCRIPTION')) {
      colorClass = 'bg-amber-50 text-amber-700 border-amber-200';
    }

    return (
      <span className={`inline-block px-2.5 py-1 text-[11px] font-black uppercase rounded-lg border ${colorClass}`}>
        {eventType.replace(/_/g, ' ')}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Optional Standalone Header Banner */}
      {!hideHeaderBanner && (
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
            <div className="flex items-center gap-3.5">
              <div className="p-3.5 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400">
                <Mail className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight">Email System Logs</h1>
                <p className="text-xs text-slate-300 mt-1 font-medium">
                  Dynamic Email Template Engine & Live Audit Queue with HTML Preview Support
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsIdentityModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 font-bold text-xs flex items-center gap-2 transition-all backdrop-blur-xs"
            >
              <Settings className="h-4 w-4 text-amber-400" />
              <span>Configure Email Identity</span>
            </button>
          </div>
        </div>
      )}

      {/* Modern Light KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-slate-400 font-extrabold text-[11px] uppercase tracking-wider block">Total Logged</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">{totalCount}</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0">
            <Mail className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-amber-600 font-extrabold text-[11px] uppercase tracking-wider block">Pending Queue</span>
            <span className="text-2xl font-black text-amber-600 mt-1 block">{pendingCount}</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
            <Clock className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-emerald-600 font-extrabold text-[11px] uppercase tracking-wider block">Delivered (Sent)</span>
            <span className="text-2xl font-black text-emerald-600 mt-1 block">{sentCount}</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-rose-600 font-extrabold text-[11px] uppercase tracking-wider block">Failed Delivery</span>
            <span className="text-2xl font-black text-rose-600 mt-1 block">{failedCount}</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Control Bar: Search & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by recipient or subject..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-slate-900 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-semibold"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Filter by Event Type */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={eventFilter}
              onChange={e => setEventFilter(e.target.value)}
              className="bg-transparent font-bold text-slate-700 outline-hidden text-xs"
            >
              <option value="ALL">All Event Types</option>
              <option value="SMTP_TEST">SMTP TEST</option>
              <option value="REQUIREMENT_RECEIVED">REQUIREMENT RECEIVED</option>
              <option value="REQUIREMENT_ASSIGNED">REQUIREMENT ASSIGNED</option>
              <option value="REQUIREMENT_ACCEPTED">REQUIREMENT ACCEPTED</option>
              <option value="REQUIREMENT_REJECTED">REQUIREMENT REJECTED</option>
              <option value="CANDIDATE_SUBMITTED">CANDIDATE SUBMITTED</option>
              <option value="CLIENT_INTERVIEW">CLIENT INTERVIEW</option>
              <option value="CLIENT_HOLD">CLIENT HOLD</option>
              <option value="CLIENT_REJECT">CLIENT REJECT</option>
              <option value="SUBSCRIPTION_EXPIRY">SUBSCRIPTION EXPIRY</option>
            </select>
          </div>

          {/* Filter by Status */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-transparent font-bold text-slate-700 outline-hidden text-xs"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">PENDING</option>
              <option value="SENT">SENT</option>
              <option value="FAILED">FAILED</option>
            </select>
          </div>

          <button
            onClick={() => router.refresh()}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
            title="Refresh Logs"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Email Logs Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider">
                <th className="py-4 px-6">Event Type</th>
                <th className="py-4 px-6">Recipient Email</th>
                <th className="py-4 px-6">Subject</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6">Logged At</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Mail className="h-10 w-10 mx-auto mb-3 opacity-30 text-slate-400" />
                    <p className="font-extrabold text-sm text-slate-600">No Email Logs Found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Email event logs will appear automatically when system trigger actions occur.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6">{renderEventTypeBadge(log.eventType)}</td>
                    
                    <td className="py-4 px-6 font-bold text-slate-900">
                      {log.recipientEmail}
                    </td>

                    <td className="py-4 px-6 font-semibold text-slate-700 max-w-xs truncate">
                      {log.subject}
                    </td>

                    <td className="py-4 px-6">{renderStatusBadge(log.status)}</td>

                    <td className="py-4 px-6 font-medium text-slate-500 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>

                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* View Error Button for FAILED logs */}
                        {log.status === 'FAILED' && (
                          <button
                            onClick={() => setInspectingErrorLog(log)}
                            className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-200/80 font-extrabold text-xs flex items-center gap-1.5 transition-colors"
                            title="Inspect full SMTP delivery error details"
                          >
                            <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
                            <span>View Error</span>
                          </button>
                        )}

                        {/* Retry / Resend Button */}
                        {(log.status === 'FAILED' || log.status === 'PENDING') && (
                          <button
                            onClick={() => handleRetryEmail(log.id)}
                            disabled={retryingLogId === log.id}
                            className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-950 border border-indigo-200/80 font-extrabold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
                            title="Retry sending email via SMTP"
                          >
                            <RotateCw className={`h-3.5 w-3.5 text-indigo-600 ${retryingLogId === log.id ? 'animate-spin' : ''}`} />
                            <span>{retryingLogId === log.id ? 'Resending...' : 'Retry'}</span>
                          </button>
                        )}

                        {/* Preview Email Button */}
                        <button
                          onClick={() => {
                            setPreviewLog(log);
                            setPreviewTab('html');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 font-extrabold text-xs flex items-center gap-1.5 transition-colors"
                        >
                          <Eye className="h-3.5 w-3.5 text-amber-600" />
                          <span>Preview Email</span>
                        </button>

                        {/* Details Drawer Button */}
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                          title="View Log Payload Details"
                        >
                          <FileText className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1: Configure Email Identity Settings */}
      {isIdentityModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6 border border-slate-100 relative">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600">
                  <Settings className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Agency Email Identity</h3>
                  <p className="text-xs text-slate-500">Configure outbound email identity settings</p>
                </div>
              </div>

              <button
                onClick={() => setIsIdentityModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {identitySuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{identitySuccess}</span>
              </div>
            )}

            {identityError && (
              <div className="p-3.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                <span>{identityError}</span>
              </div>
            )}

            <form onSubmit={handleSaveIdentity} className="space-y-4 text-xs">
              <div>
                <label className="block font-extrabold text-slate-700 mb-1">Sender Name</label>
                <input
                  type="text"
                  placeholder="e.g. RecruitOS Talent Team"
                  value={senderName}
                  onChange={e => setSenderName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-semibold"
                />
                <p className="text-[11px] text-slate-400 mt-1">Default display name on outbound system email logs.</p>
              </div>

              <div>
                <label className="block font-extrabold text-slate-700 mb-1">Reply-To Email</label>
                <input
                  type="email"
                  placeholder="e.g. talent@youragency.com"
                  value={replyToEmail}
                  onChange={e => setReplyToEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-semibold"
                />
                <p className="text-[11px] text-slate-400 mt-1">Email address to receive replies from clients and candidates.</p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsIdentityModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-extrabold"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSavingIdentity}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-md shadow-amber-500/20 transition-all flex items-center gap-2"
                >
                  {isSavingIdentity ? 'Saving...' : 'Save Email Identity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: View Email Log Payload Details */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-6 border border-slate-100 relative">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Email Log Details</h3>
                  <p className="text-xs text-slate-500">ID: {selectedLog.id}</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedLog(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-slate-400 font-bold block">EVENT TYPE</span>
                  <span className="font-black text-slate-900 mt-0.5 block">{selectedLog.eventType}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block">STATUS</span>
                  <div className="mt-0.5">{renderStatusBadge(selectedLog.status)}</div>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block">RECIPIENT EMAIL</span>
                  <span className="font-bold text-slate-900 mt-0.5 block">{selectedLog.recipientEmail}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block">LOGGED DATE</span>
                  <span className="font-medium text-slate-700 mt-0.5 block">
                    {new Date(selectedLog.createdAt).toLocaleString()}
                  </span>
                </div>
                {selectedLog.sentAt && (
                  <div>
                    <span className="text-slate-400 font-bold block">SENT TIMESTAMP</span>
                    <span className="font-bold text-emerald-700 mt-0.5 block">
                      {new Date(selectedLog.sentAt).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <span className="block font-extrabold text-slate-700 mb-1">SUBJECT</span>
                <p className="p-3 bg-slate-100 rounded-xl font-bold text-slate-900">{selectedLog.subject}</p>
              </div>

              {selectedLog.errorMessage && (
                <div>
                  <span className="block font-extrabold text-rose-700 mb-1">ERROR MESSAGE</span>
                  <p className="p-3 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl font-mono text-xs">
                    {selectedLog.errorMessage}
                  </p>
                </div>
              )}

              {selectedLog.metadata && (
                <div>
                  <span className="block font-extrabold text-slate-700 mb-1">METADATA (JSON PAYLOAD)</span>
                  <pre className="p-4 bg-slate-900 text-amber-400 rounded-2xl font-mono text-[11px] overflow-x-auto max-h-48 leading-relaxed">
                    {JSON.stringify(JSON.parse(selectedLog.metadata), null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setPreviewLog(selectedLog);
                    setSelectedLog(null);
                    setPreviewTab('html');
                  }}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  <span>Preview Email Render</span>
                </button>

                {(selectedLog.status === 'FAILED' || selectedLog.status === 'PENDING') && (
                  <button
                    onClick={() => handleRetryEmail(selectedLog.id)}
                    disabled={retryingLogId === selectedLog.id}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs flex items-center gap-2"
                  >
                    <RotateCw className={`h-4 w-4 ${retryingLogId === selectedLog.id ? 'animate-spin' : ''}`} />
                    <span>{retryingLogId === selectedLog.id ? 'Resending...' : 'Retry Delivery'}</span>
                  </button>
                )}
              </div>

              <button
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-extrabold text-xs hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: FULL EMAIL PREVIEW MODAL (Requirement 13) */}
      {previewLog && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-slate-900 text-white rounded-3xl max-w-5xl w-full h-[90vh] flex flex-col shadow-2xl border border-slate-800 relative overflow-hidden">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-slate-950/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black tracking-tight text-white flex items-center gap-2">
                    <span>Email Render Preview</span>
                    {renderEventTypeBadge(previewLog.eventType)}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium truncate max-w-md">
                    To: <span className="text-amber-400 font-bold">{previewLog.recipientEmail}</span> • Subject: {previewLog.subject}
                  </p>
                </div>
              </div>

              {/* Viewport & View Mode Controls */}
              <div className="flex items-center gap-3">
                {previewTab === 'html' && (
                  <div className="flex items-center bg-slate-800 rounded-xl p-1 border border-slate-700">
                    <button
                      onClick={() => setViewportMode('desktop')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                        viewportMode === 'desktop' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Laptop className="h-3.5 w-3.5" />
                      <span>Desktop</span>
                    </button>
                    <button
                      onClick={() => setViewportMode('mobile')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                        viewportMode === 'mobile' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Smartphone className="h-3.5 w-3.5" />
                      <span>Mobile</span>
                    </button>
                  </div>
                )}

                <button
                  onClick={() => setPreviewLog(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Tabs Bar */}
            <div className="px-6 py-2.5 bg-slate-950/80 border-b border-slate-800 flex items-center gap-2 text-xs font-bold">
              <button
                onClick={() => setPreviewTab('html')}
                className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all ${
                  previewTab === 'html'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 font-black'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Eye className="h-3.5 w-3.5" />
                <span>HTML Render</span>
              </button>

              <button
                onClick={() => setPreviewTab('text')}
                className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all ${
                  previewTab === 'text'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 font-black'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Plain Text</span>
              </button>

              <button
                onClick={() => setPreviewTab('json')}
                className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all ${
                  previewTab === 'json'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 font-black'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Code className="h-3.5 w-3.5" />
                <span>Metadata JSON</span>
              </button>
            </div>

            {/* Preview Body Area */}
            <div className="flex-1 bg-slate-950 p-4 sm:p-6 overflow-y-auto flex items-center justify-center">
              {previewTab === 'html' && (
                <div
                  className={`bg-white rounded-2xl shadow-2xl transition-all duration-300 overflow-hidden h-full flex flex-col ${
                    viewportMode === 'mobile' ? 'w-[375px]' : 'w-full max-w-[760px]'
                  }`}
                >
                  {previewLog.htmlBody ? (
                    <iframe
                      srcDoc={previewLog.htmlBody}
                      title="Email HTML Preview"
                      className="w-full h-full border-0 rounded-2xl bg-white"
                      sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin"
                    />
                  ) : (
                    <div className="p-12 text-center text-slate-400 my-auto">
                      <Mail className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                      <p className="font-extrabold text-slate-700">No HTML Body Generated</p>
                      <p className="text-xs text-slate-400 mt-1">This legacy email log entry was created before HTML template engine integration.</p>
                    </div>
                  )}
                </div>
              )}

              {previewTab === 'text' && (
                <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl p-6 h-full overflow-y-auto text-slate-200 font-mono text-xs leading-relaxed whitespace-pre-wrap">
                  {previewLog.textBody || 'No plain text body stored.'}
                </div>
              )}

              {previewTab === 'json' && (
                <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl p-6 h-full overflow-y-auto text-amber-400 font-mono text-xs">
                  <pre>
                    {previewLog.metadata
                      ? JSON.stringify(JSON.parse(previewLog.metadata), null, 2)
                      : '// No metadata recorded.'}
                  </pre>
                </div>
              )}
            </div>

            {/* Footer Status Bar */}
            <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/70 text-xs text-slate-400 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Render Engine Ready (EM-01 Production Standard)</span>
              </div>

              <button
                onClick={() => setPreviewLog(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold"
              >
                Close Preview
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Modal 3: ISSUE #4 Error Inspection Modal for FAILED Email Logs */}
      {inspectingErrorLog && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 border border-slate-100 relative">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">SMTP Delivery Failure Audit</h3>
                  <p className="text-xs text-slate-500">Detailed error trace and delivery metadata</p>
                </div>
              </div>

              <button
                onClick={() => setInspectingErrorLog(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Error Details Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
                <span className="text-[11px] font-extrabold uppercase text-slate-400 block mb-1">Target Recipient</span>
                <span className="font-black text-slate-900 break-all">{inspectingErrorLog.recipientEmail}</span>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
                <span className="text-[11px] font-extrabold uppercase text-slate-400 block mb-1">Logged Timestamp</span>
                <span className="font-black text-slate-900">
                  {new Date(inspectingErrorLog.createdAt).toLocaleString()}
                </span>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
                <span className="text-[11px] font-extrabold uppercase text-slate-400 block mb-1">Event Type</span>
                <span className="font-black text-purple-700 uppercase">{inspectingErrorLog.eventType}</span>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
                <span className="text-[11px] font-extrabold uppercase text-slate-400 block mb-1">Subject Line</span>
                <span className="font-black text-slate-900 truncate block">{inspectingErrorLog.subject}</span>
              </div>
            </div>

            {/* Error Message Box */}
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase tracking-wider text-rose-700">
                Exact Error Exception Message
              </label>
              <div className="bg-rose-950 text-rose-200 border border-rose-800/60 rounded-2xl p-4 text-xs font-mono whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                {inspectingErrorLog.errorMessage || 'No error message string recorded in database.'}
              </div>
            </div>

            {/* Metadata Payload Trace */}
            {inspectingErrorLog.metadata && (
              <div className="space-y-2">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-600">
                  Metadata & Event Payload
                </label>
                <div className="bg-slate-900 text-amber-400 border border-slate-800 rounded-2xl p-4 text-xs font-mono max-h-40 overflow-y-auto">
                  <pre>
                    {typeof inspectingErrorLog.metadata === 'string'
                      ? JSON.stringify(JSON.parse(inspectingErrorLog.metadata), null, 2)
                      : JSON.stringify(inspectingErrorLog.metadata, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* Footer Action Buttons */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs">
              <button
                onClick={() => setInspectingErrorLog(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 transition-colors"
              >
                Close Audit
              </button>

              <button
                onClick={() => {
                  const logId = inspectingErrorLog.id;
                  setInspectingErrorLog(null);
                  handleRetryEmail(logId);
                }}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black flex items-center gap-2 transition-all shadow-md shadow-indigo-600/20"
              >
                <RotateCw className="h-4 w-4" />
                <span>Retry Dispatch Now</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
