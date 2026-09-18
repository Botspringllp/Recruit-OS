'use client';

import React, { useState } from 'react';
import { Mail, Send, AlertTriangle, CheckCircle2, Clock, Search, Filter, RefreshCw, Eye, Settings, ShieldAlert, Sparkles, X } from 'lucide-react';
import { updateAgencyEmailIdentityAction } from '@/app/actions/emailIdentity';
import { useRouter } from 'next/navigation';

export interface EmailLogItem {
  id: string;
  agencyId: string | null;
  eventType: string;
  recipientEmail: string;
  subject: string;
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

interface EmailLogsClientProps {
  initialLogs: EmailLogItem[];
  agencyIdentity?: AgencyIdentityData | null;
  userRole: string;
}

export const EmailLogsClient: React.FC<EmailLogsClientProps> = ({
  initialLogs,
  agencyIdentity,
  userRole
}) => {
  const router = useRouter();
  const [logs, setLogs] = useState<EmailLogItem[]>(initialLogs);
  const [searchTerm, setSearchTerm] = useState('');
  const [eventFilter, setEventFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedLog, setSelectedLog] = useState<EmailLogItem | null>(null);

  // Agency Identity Settings state
  const [isIdentityModalOpen, setIsIdentityModalOpen] = useState(false);
  const [senderName, setSenderName] = useState(agencyIdentity?.senderName || '');
  const [replyToEmail, setReplyToEmail] = useState(agencyIdentity?.replyToEmail || '');
  const [isSavingIdentity, setIsSavingIdentity] = useState(false);
  const [identitySuccess, setIdentitySuccess] = useState<string | null>(null);
  const [identityError, setIdentityError] = useState<string | null>(null);

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

    if (eventType.includes('REQUIREMENT')) {
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
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="p-3.5 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400">
              <Mail className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight">Email System Logs</h1>
                <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase rounded-full bg-amber-500 text-slate-950">
                  PHASE EM-00
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 font-medium">
                Live database audit queue for multi-tenant platform email event triggers
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

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-white/10 text-xs">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5">
            <span className="text-slate-400 block font-bold text-[11px]">TOTAL LOGGED</span>
            <span className="text-xl font-black text-white mt-0.5 block">{totalCount}</span>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3.5">
            <span className="text-amber-300 block font-bold text-[11px]">PENDING QUEUE</span>
            <span className="text-xl font-black text-amber-400 mt-0.5 block">{pendingCount}</span>
          </div>

          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-3.5">
            <span className="text-emerald-300 block font-bold text-[11px]">DELIVERED (SENT)</span>
            <span className="text-xl font-black text-emerald-400 mt-0.5 block">{sentCount}</span>
          </div>

          <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-3.5">
            <span className="text-rose-300 block font-bold text-[11px]">FAILED DELIVERY</span>
            <span className="text-xl font-black text-rose-400 mt-0.5 block">{failedCount}</span>
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
                <th className="py-4 px-6 text-right">Details</th>
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
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                        title="View Email Payload Metadata"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
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

      {/* Modal 2: View Email Log Payload Metadata */}
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

            <div className="flex items-center justify-end pt-4 border-t border-slate-100">
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
    </div>
  );
};
