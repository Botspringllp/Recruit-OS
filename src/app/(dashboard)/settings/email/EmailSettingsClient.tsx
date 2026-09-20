'use client';

import React, { useState } from 'react';
import {
  Mail,
  Server,
  Shield,
  Send,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Key,
  Globe,
  Settings,
  Sparkles,
  HelpCircle,
  RefreshCw,
  Zap,
  Lock,
  Eye,
  EyeOff,
  ListFilter
} from 'lucide-react';
import {
  saveAgencySMTPSettingsAction,
  testAgencySMTPConnectionAction
} from '@/app/actions/emailSmtpActions';
import { EmailLogsClient, EmailLogItem, AgencyIdentityData } from '../email-logs/EmailLogsClient';
import { useRouter } from 'next/navigation';

export interface SMTPSettingsData {
  smtpEnabled: boolean;
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUsername: string;
  hasPassword: boolean;
  senderName: string;
  senderEmail: string;
  replyToEmail: string;
  smtpLastTestedAt: string | null;
  smtpLastTestStatus: string | null;
}

interface EmailSettingsClientProps {
  initialData: SMTPSettingsData;
  userEmail: string;
  initialLogs?: EmailLogItem[];
  agencyIdentity?: AgencyIdentityData | null;
  userRole?: string;
  defaultTab?: 'smtp' | 'logs';
}

export const EmailSettingsClient: React.FC<EmailSettingsClientProps> = ({
  initialData,
  userEmail,
  initialLogs = [],
  agencyIdentity = null,
  userRole = 'AGENCY_OWNER',
  defaultTab = 'smtp'
}) => {
  const router = useRouter();

  // Active Sub Tab: 'smtp' or 'logs'
  const [activeTab, setActiveTab] = useState<'smtp' | 'logs'>(defaultTab);

  // Settings State
  const [smtpEnabled, setSmtpEnabled] = useState(initialData.smtpEnabled);
  const [smtpHost, setSmtpHost] = useState(initialData.smtpHost);
  const [smtpPort, setSmtpPort] = useState(initialData.smtpPort || 587);
  const [smtpSecure, setSmtpSecure] = useState(initialData.smtpSecure);
  const [smtpUsername, setSmtpUsername] = useState(initialData.smtpUsername);
  const [smtpPassword, setSmtpPassword] = useState('');
  const [hasPassword, setHasPassword] = useState(initialData.hasPassword);
  const [showPassword, setShowPassword] = useState(false);

  const [senderName, setSenderName] = useState(initialData.senderName);
  const [senderEmail, setSenderEmail] = useState(initialData.senderEmail);
  const [replyToEmail, setReplyToEmail] = useState(initialData.replyToEmail);

  // Status & Actions
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Test Connection State
  const [testEmail, setTestEmail] = useState(userEmail || initialData.senderEmail || '');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null);



  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(null);
    setSaveError(null);

    const res = await saveAgencySMTPSettingsAction({
      smtpEnabled: true,
      smtpHost,
      smtpPort,
      smtpSecure,
      smtpUsername,
      smtpPassword: smtpPassword.trim() ? smtpPassword : undefined,
      senderName,
      senderEmail,
      replyToEmail
    });

    setIsSaving(false);

    if (res.success) {
      setSaveSuccess('SMTP configuration & email identity saved successfully!');
      if (smtpPassword.trim()) {
        setHasPassword(true);
        setSmtpPassword('');
      }
      router.refresh();
    } else {
      setSaveError(res.error || 'Failed to save SMTP settings.');
    }
  };

  const handleTestConnection = async () => {
    if (!testEmail || !testEmail.includes('@')) {
      setTestResult({ success: false, error: 'Please enter a valid target recipient email.' });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    const res = await testAgencySMTPConnectionAction(testEmail.trim());
    setIsTesting(false);

    if (res.success) {
      setTestResult({ success: true, message: res.message });
      router.refresh();
    } else {
      setTestResult({ success: false, error: res.error });
    }
  };

  const isConnected = initialData.smtpLastTestStatus?.startsWith('SUCCESS');

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="p-3.5 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400">
              <Mail className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">Agency Email Hub</h1>
              <p className="text-xs text-slate-300 mt-1 font-medium">
                Manage custom SMTP server credentials, sender identity, and view real-time email dispatch logs
              </p>
            </div>
          </div>

          {/* Sub-Tab Switcher */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-950/60 border border-slate-800 rounded-2xl shrink-0">
            <button
              onClick={() => setActiveTab('smtp')}
              className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all ${
                activeTab === 'smtp'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Server className="h-4 w-4" />
              <span>SMTP Settings</span>
            </button>

            <button
              onClick={() => setActiveTab('logs')}
              className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all ${
                activeTab === 'logs'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <ListFilter className="h-4 w-4" />
              <span>Email Logs ({initialLogs.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* SUB-TAB 1: SMTP CONFIGURATION & SERVER SETTINGS */}
      {activeTab === 'smtp' && (
        <div className="space-y-8">

          {/* ISSUE #6: SMTP OPERATIONAL STATUS DASHBOARD CARDS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-slate-400 font-extrabold text-[11px] uppercase tracking-wider block">SMTP Status</span>
                <span className={`text-xs font-black mt-1 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${
                  initialData.smtpLastTestStatus?.includes('SUCCESS')
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : initialData.smtpLastTestStatus?.includes('FAILED')
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                  <span>
                    {initialData.smtpLastTestStatus?.includes('SUCCESS')
                      ? 'CONNECTED'
                      : initialData.smtpLastTestStatus?.includes('FAILED')
                      ? 'FAILED'
                      : 'UNVERIFIED'}
                  </span>
                </span>
              </div>
              <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shrink-0">
                <Zap className="h-5 w-5" />
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-slate-400 font-extrabold text-[11px] uppercase tracking-wider block">Last Handshake</span>
                <span className="text-xs font-black text-slate-900 mt-1 block truncate max-w-[120px]">
                  {initialData.smtpLastTestedAt ? new Date(initialData.smtpLastTestedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never'}
                </span>
              </div>
              <div className="h-10 w-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0">
                <Clock className="h-5 w-5" />
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-slate-400 font-extrabold text-[11px] uppercase tracking-wider block">Test Recipient</span>
                <span className="text-xs font-black text-slate-900 mt-1 block truncate max-w-[120px]" title={testEmail}>
                  {testEmail || 'None'}
                </span>
              </div>
              <div className="h-10 w-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 shrink-0">
                <Send className="h-5 w-5" />
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-slate-400 font-extrabold text-[11px] uppercase tracking-wider block">Last Result</span>
                <span className="text-xs font-black text-slate-900 mt-1 block truncate max-w-[120px]" title={initialData.smtpLastTestStatus || 'No test recorded'}>
                  {initialData.smtpLastTestStatus || 'No test recorded'}
                </span>
              </div>
              <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
                <Shield className="h-5 w-5" />
              </div>
            </div>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-8">
            {saveSuccess && (
              <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-extrabold flex items-center gap-2 shadow-xs">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                <span>{saveSuccess}</span>
              </div>
            )}

            {saveError && (
              <div className="p-4 rounded-2xl bg-rose-50 text-rose-800 border border-rose-200 text-xs font-extrabold flex items-center gap-2 shadow-xs">
                <AlertTriangle className="h-5 w-5 shrink-0 text-rose-600" />
                <span>{saveError}</span>
              </div>
            )}

            {/* SECTION B: SMTP CONFIGURATION & PROVIDER PRESETS */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600">
                    <Server className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900">SMTP Server Configuration</h2>
                    <p className="text-xs text-slate-500">Provide your agency's custom SMTP host credentials</p>
                  </div>
                </div>

                {/* ISSUE #1: PROVIDER PRESET SELECTORS */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="text-slate-400 font-bold text-[11px] mr-1">Presets:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSmtpHost('smtp.gmail.com');
                      setSmtpPort(587);
                      setSmtpSecure(false);
                    }}
                    className={`px-3 py-1.5 rounded-xl font-extrabold transition-colors ${
                      smtpHost === 'smtp.gmail.com' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    Google Workspace
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSmtpHost('smtp.office365.com');
                      setSmtpPort(587);
                      setSmtpSecure(false);
                    }}
                    className={`px-3 py-1.5 rounded-xl font-extrabold transition-colors ${
                      smtpHost === 'smtp.office365.com' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    Microsoft 365
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (smtpHost === 'smtp.gmail.com' || smtpHost === 'smtp.office365.com') {
                        setSmtpHost('');
                      }
                    }}
                    className={`px-3 py-1.5 rounded-xl font-extrabold transition-colors ${
                      smtpHost !== 'smtp.gmail.com' && smtpHost !== 'smtp.office365.com' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    Custom SMTP
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
                <div>
                  <label className="block font-extrabold text-slate-700 mb-1">
                    SMTP Host Server <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. smtp.gmail.com or smtp.office365.com"
                    value={smtpHost}
                    onChange={e => setSmtpHost(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-semibold focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-extrabold text-slate-700 mb-1">
                    SMTP Port <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 587 or 465"
                    value={smtpPort}
                    onChange={e => {
                      const port = Number(e.target.value);
                      setSmtpPort(port);
                      setSmtpSecure(port === 465);
                    }}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-semibold focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    {smtpPort === 465 ? '🔒 Implicit SSL/TLS Enabled (Port 465)' : '⚡ Explicit STARTTLS Enabled (Port 587)'}
                  </p>
                </div>

                <div>
                  <label className="block font-extrabold text-slate-700 mb-1">
                    SMTP Username (Email / App ID) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. recruiter@agency.com"
                    value={smtpUsername}
                    onChange={e => setSmtpUsername(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-semibold focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-extrabold text-slate-700">
                      SMTP Password / App Password
                    </label>
                    {hasPassword && (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        Password Configured
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder={hasPassword ? '•••••••••••••••• (Leave blank to keep existing)' : 'Enter SMTP App Password'}
                      value={smtpPassword}
                      onChange={e => setSmtpPassword(e.target.value)}
                      className="w-full px-4 py-2.5 pr-10 rounded-xl border border-slate-200 text-slate-900 font-semibold focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    For Gmail, use a 16-character App Password generated from Google Security settings.
                  </p>
                </div>
              </div>
            </div>

            {/* SECTION C: EMAIL IDENTITY */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8 space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900">Email Sender Identity</h2>
                  <p className="text-xs text-slate-500">Configure outbound email header identity details</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
                <div>
                  <label className="block font-extrabold text-slate-700 mb-1">
                    Sender Display Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Apex Talent Team"
                    value={senderName}
                    onChange={e => setSenderName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-semibold focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-extrabold text-slate-700 mb-1">
                    Sender Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. talent@apexrecruiting.com"
                    value={senderEmail}
                    onChange={e => setSenderEmail(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-semibold focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-extrabold text-slate-700 mb-1">
                    Reply-To Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. support@apexrecruiting.com"
                    value={replyToEmail}
                    onChange={e => setReplyToEmail(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-semibold focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                {/* ISSUE #5: SENDER EMAIL MISMATCH WARNING */}
                {senderEmail && smtpUsername && senderEmail.trim().toLowerCase() !== smtpUsername.trim().toLowerCase() && (
                  <div className="col-span-1 sm:col-span-3 p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs font-semibold flex items-start gap-2.5">
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-extrabold block">Sender Email Mismatch Notice</span>
                      <span>
                        Your SMTP provider (e.g. Gmail / Office 365) may override the <code>From</code> address to <strong>{smtpUsername}</strong> unless <strong>{senderEmail}</strong> is configured as a verified alias on your email server. For best deliverability, use the same address as your SMTP Username.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2"
              >
                <Key className="h-4 w-4" />
                <span>{isSaving ? 'Saving Configuration...' : 'Save SMTP Settings'}</span>
              </button>
            </div>
          </form>

          {/* SECTION D: CONNECTION TEST & LIVE VERIFICATION */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 border border-slate-800">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Send className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-white">Live Connection Test & Email Verification</h2>
                <p className="text-xs text-slate-400">Perform an active SMTP handshake and dispatch a test email to verify delivery</p>
              </div>
            </div>

            {testResult && (
              <div>
                {testResult.success ? (
                  <div className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
                    <span>{testResult.message}</span>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-bold flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 shrink-0 text-rose-400 mt-0.5" />
                    <div>
                      <span className="font-extrabold block">SMTP Connection Failed</span>
                      <span className="font-mono text-[11px] block mt-1 leading-relaxed text-rose-300">
                        {testResult.error}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="w-full sm:flex-1">
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  Target Test Email Recipient
                </label>
                <input
                  type="email"
                  placeholder="e.g. owner@agency.com"
                  value={testEmail}
                  onChange={e => setTestEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-semibold text-xs focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                />
              </div>

              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="w-full sm:w-auto px-6 py-2.5 mt-5 sm:mt-0 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all flex items-center justify-center gap-2 shrink-0 shadow-lg shadow-amber-500/20"
              >
                <RefreshCw className={`h-4 w-4 ${isTesting ? 'animate-spin' : ''}`} />
                <span>{isTesting ? 'Testing Handshake...' : 'Send Test Email'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: EMAIL LOGS & AUDIT QUEUE */}
      {activeTab === 'logs' && (
        <EmailLogsClient
          initialLogs={initialLogs}
          agencyIdentity={agencyIdentity}
          userRole={userRole}
          hideHeaderBanner={true}
        />
      )}
    </div>
  );
};
