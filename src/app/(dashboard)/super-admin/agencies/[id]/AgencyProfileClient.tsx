'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { updateAgencyAction } from '@/app/actions/agencies';
import { SubscriptionTier, AgencyStatus } from '@prisma/client';
import {
  Building2,
  ArrowLeft,
  Edit3,
  Globe,
  User,
  ShieldCheck,
  Calendar,
  Briefcase,
  FileText,
  Users,
  FolderGit2,
  CheckCircle2,
  XCircle,
  ExternalLink,
  X,
  Layout,
  Code2
} from 'lucide-react';

interface AgencyProfileClientProps {
  agency: any;
  stats: {
    recruitersCount: number;
    clientsCount: number;
    candidatesCount: number;
    activeJobMandatesCount: number;
  };
}

export const AgencyProfileClient: React.FC<AgencyProfileClientProps> = ({
  agency: initialAgency,
  stats
}) => {
  const router = useRouter();
  const [agency, setAgency] = useState(initialAgency);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Edit Form State
  const [name, setName] = useState(agency.name || '');
  const [status, setStatus] = useState<AgencyStatus>(agency.status || AgencyStatus.ACTIVE);
  const [plan, setPlan] = useState<SubscriptionTier>(agency.subscriptionTier || SubscriptionTier.ENTERPRISE);
  const [websiteBuilderEnabled, setWebsiteBuilderEnabled] = useState(Boolean(agency.websiteBuilderEnabled));
  const [widgetEnabled, setWidgetEnabled] = useState(Boolean(agency.widgetEnabled));

  const [websiteUrl, setWebsiteUrl] = useState(agency.websiteUrl || '');
  const [businessEmail, setBusinessEmail] = useState(agency.businessEmail || '');
  const [supportEmail, setSupportEmail] = useState(agency.supportEmail || '');
  const [phone, setPhone] = useState(agency.phone || '');
  const [alternatePhone, setAlternatePhone] = useState(agency.alternatePhone || '');
  const [address, setAddress] = useState(agency.address || '');
  const [city, setCity] = useState(agency.city || '');
  const [state, setState] = useState(agency.state || '');
  const [country, setCountry] = useState(agency.country || '');
  const [companyDescription, setCompanyDescription] = useState(agency.companyDescription || '');

  const [gstNumber, setGstNumber] = useState(agency.gstNumber || '');
  const [cinNumber, setCinNumber] = useState(agency.cinNumber || '');
  const [panNumber, setPanNumber] = useState(agency.panNumber || '');

  const [subscriptionStartDate, setSubscriptionStartDate] = useState(
    agency.subscriptionStartDate ? new Date(agency.subscriptionStartDate).toISOString().slice(0, 10) : ''
  );
  const [subscriptionExpiryDate, setSubscriptionExpiryDate] = useState(
    agency.subscriptionExpiryDate ? new Date(agency.subscriptionExpiryDate).toISOString().slice(0, 10) : ''
  );

  const [ownerName, setOwnerName] = useState(agency.ownerName || '');
  const [ownerEmail, setOwnerEmail] = useState(agency.ownerEmail || '');

  const [isPending, startTransition] = useTransition();
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);
  const [saveErrorMsg, setSaveErrorMsg] = useState<string | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveErrorMsg(null);
    setSaveSuccessMsg(false);

    startTransition(async () => {
      const res = await updateAgencyAction(agency.id, {
        name,
        status,
        plan,
        websiteBuilderEnabled,
        widgetEnabled,
        websiteUrl,
        businessEmail,
        supportEmail,
        phone,
        alternatePhone,
        address,
        city,
        state,
        country,
        companyDescription,
        gstNumber,
        cinNumber,
        panNumber,
        subscriptionStartDate: subscriptionStartDate || null,
        subscriptionExpiryDate: subscriptionExpiryDate || null,
        ownerName,
        ownerEmail
      });

      if (res.success) {
        setSaveSuccessMsg(true);
        setIsEditModalOpen(false);
        router.refresh();
        setAgency((prev: any) => ({
          ...prev,
          name,
          status,
          subscriptionTier: plan,
          websiteBuilderEnabled,
          widgetEnabled,
          websiteUrl,
          businessEmail,
          supportEmail,
          phone,
          alternatePhone,
          address,
          city,
          state,
          country,
          companyDescription,
          gstNumber,
          cinNumber,
          panNumber,
          subscriptionStartDate: subscriptionStartDate ? new Date(subscriptionStartDate) : null,
          subscriptionExpiryDate: subscriptionExpiryDate ? new Date(subscriptionExpiryDate) : null,
          ownerName,
          ownerEmail
        }));
      } else {
        setSaveErrorMsg(res.error || 'Failed to update agency profile.');
      }
    });
  };

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'ACTIVE':
        return <span className="px-3 py-1 text-xs font-black rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-300">ACTIVE</span>;
      case 'SUSPENDED':
        return <span className="px-3 py-1 text-xs font-black rounded-lg bg-rose-100 text-rose-800 border border-rose-300">SUSPENDED</span>;
      case 'TRIAL':
        return <span className="px-3 py-1 text-xs font-black rounded-lg bg-amber-100 text-amber-800 border border-amber-300">TRIAL</span>;
      default:
        return <span className="px-3 py-1 text-xs font-black rounded-lg bg-slate-100 text-slate-800 border border-slate-300">{st}</span>;
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen p-6 sm:p-8 space-y-8 text-slate-900 max-w-6xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-4">
          <Link
            href="/super-admin"
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-2xl transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-[10px] font-black uppercase bg-amber-500 text-slate-950 rounded-md">
                Agency Profile
              </span>
              {getStatusBadge(agency.status)}
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <Building2 className="h-6 w-6 text-amber-500" />
              {agency.name}
            </h1>
            <p className="text-xs text-slate-400 font-mono">
              Tenant ID: {agency.id} • {agency.subdomain}.recruitos.com
            </p>
          </div>
        </div>

        {/* Part 4: Edit Agency Capability Button */}
        <button
          onClick={() => setIsEditModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition-all shrink-0"
        >
          <Edit3 className="h-4 w-4" />
          <span>Edit Agency</span>
        </button>
      </div>

      {saveSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600" />
            <span>Agency profile updated successfully!</span>
          </div>
          <button onClick={() => setSaveSuccessMsg(false)} className="text-emerald-700 hover:text-emerald-950">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Part 3: Live Platform Statistics (No hardcoded values!) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Recruiters</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900">{stats.recruitersCount}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Clients</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Building2 className="h-5 w-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900">{stats.clientsCount}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Candidates</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <User className="h-5 w-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900">{stats.candidatesCount}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Active Job Mandates</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <FolderGit2 className="h-5 w-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900">{stats.activeJobMandatesCount}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Basic Info & Feature Access */}
        <div className="space-y-8 lg:col-span-1">
          {/* Section 1: Basic Information */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
            <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
              <User className="h-4 w-4 text-amber-500" />
              1. Basic Information
            </h2>

            <div className="space-y-3.5 text-xs">
              <div>
                <span className="text-slate-400 font-bold block text-[10px] uppercase">Agency Name</span>
                <span className="font-extrabold text-slate-900 text-sm">{agency.name}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block text-[10px] uppercase">Subdomain</span>
                <span className="font-mono font-bold text-indigo-600">{agency.subdomain}.recruitos.com</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block text-[10px] uppercase">Owner Name</span>
                <span className="font-bold text-slate-900">{agency.ownerName || 'Unassigned'}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block text-[10px] uppercase">Owner Email</span>
                <span className="font-bold text-slate-900">{agency.ownerEmail || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block text-[10px] uppercase">Provisioned Date</span>
                <span className="font-medium text-slate-700">{new Date(agency.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Section 5: Feature Access (Part 1 & 7) */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
            <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
              <Layout className="h-4 w-4 text-amber-500" />
              5. Feature Access Controls
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-150">
                <div className="flex items-center gap-2.5">
                  <Layout className="h-4 w-4 text-indigo-600" />
                  <span className="text-xs font-extrabold text-slate-800">Website Builder</span>
                </div>
                {agency.websiteBuilderEnabled ? (
                  <span className="px-2.5 py-1 text-[10px] font-black rounded-md bg-emerald-100 text-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Enabled
                  </span>
                ) : (
                  <span className="px-2.5 py-1 text-[10px] font-black rounded-md bg-slate-200 text-slate-700 flex items-center gap-1">
                    <XCircle className="h-3 w-3" /> Disabled
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-150">
                <div className="flex items-center gap-2.5">
                  <Code2 className="h-4 w-4 text-emerald-600" />
                  <span className="text-xs font-extrabold text-slate-800">Widget Generator</span>
                </div>
                {agency.widgetEnabled ? (
                  <span className="px-2.5 py-1 text-[10px] font-black rounded-md bg-emerald-100 text-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Enabled
                  </span>
                ) : (
                  <span className="px-2.5 py-1 text-[10px] font-black rounded-md bg-slate-200 text-slate-700 flex items-center gap-1">
                    <XCircle className="h-3 w-3" /> Disabled
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Section 4: Subscription Information */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
            <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-amber-500" />
              4. Subscription Details
            </h2>

            <div className="space-y-3.5 text-xs">
              <div>
                <span className="text-slate-400 font-bold block text-[10px] uppercase">Plan Tier</span>
                <span className="font-extrabold text-indigo-700 text-sm">{agency.subscriptionTier}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block text-[10px] uppercase">Account Status</span>
                <span className="font-bold">{agency.status}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block text-[10px] uppercase">Start Date</span>
                <span className="font-medium text-slate-800">
                  {agency.subscriptionStartDate ? new Date(agency.subscriptionStartDate).toLocaleDateString() : 'Not Set'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block text-[10px] uppercase">Expiry Date</span>
                <span className="font-medium text-slate-800">
                  {agency.subscriptionExpiryDate ? new Date(agency.subscriptionExpiryDate).toLocaleDateString() : 'Lifetime / Unlimited'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Business & Legal Info */}
        <div className="space-y-8 lg:col-span-2">
          {/* Section 2: Business Information */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-amber-500" />
              2. Business Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
              <div>
                <span className="text-slate-400 font-bold block text-[10px] uppercase">Website URL</span>
                {agency.websiteUrl ? (
                  <a
                    href={agency.websiteUrl.startsWith('http') ? agency.websiteUrl : `https://${agency.websiteUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-amber-600 hover:underline flex items-center gap-1 mt-0.5"
                  >
                    <Globe className="h-3.5 w-3.5" />
                    <span>{agency.websiteUrl}</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <span className="text-slate-400 italic">No Website Configured</span>
                )}
              </div>

              <div>
                <span className="text-slate-400 font-bold block text-[10px] uppercase">Business Email</span>
                <span className="font-bold text-slate-900">{agency.businessEmail || 'N/A'}</span>
              </div>

              <div>
                <span className="text-slate-400 font-bold block text-[10px] uppercase">Support Email</span>
                <span className="font-bold text-slate-900">{agency.supportEmail || 'N/A'}</span>
              </div>

              <div>
                <span className="text-slate-400 font-bold block text-[10px] uppercase">Phone</span>
                <span className="font-bold text-slate-900">{agency.phone || 'N/A'}</span>
              </div>

              <div>
                <span className="text-slate-400 font-bold block text-[10px] uppercase">Alternate Phone</span>
                <span className="font-bold text-slate-900">{agency.alternatePhone || 'N/A'}</span>
              </div>

              <div>
                <span className="text-slate-400 font-bold block text-[10px] uppercase">Location</span>
                <span className="font-bold text-slate-900">
                  {[agency.city, agency.state, agency.country].filter(Boolean).join(', ') || 'N/A'}
                </span>
              </div>

              <div className="sm:col-span-2">
                <span className="text-slate-400 font-bold block text-[10px] uppercase">Full Address</span>
                <span className="font-medium text-slate-800">{agency.address || 'N/A'}</span>
              </div>

              <div className="sm:col-span-2">
                <span className="text-slate-400 font-bold block text-[10px] uppercase">Company Description</span>
                <span className="font-medium text-slate-800 leading-relaxed block mt-1 bg-slate-50 p-3 rounded-xl border border-slate-150">
                  {agency.companyDescription || 'No description provided.'}
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Legal Information */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
              <FileText className="h-4 w-4 text-amber-500" />
              3. Legal Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-150">
                <span className="text-slate-400 font-bold block text-[10px] uppercase">GST Number</span>
                <span className="font-mono font-bold text-slate-900 text-sm mt-0.5 block">{agency.gstNumber || 'N/A'}</span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-150">
                <span className="text-slate-400 font-bold block text-[10px] uppercase">CIN Number</span>
                <span className="font-mono font-bold text-slate-900 text-sm mt-0.5 block">{agency.cinNumber || 'N/A'}</span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-150">
                <span className="text-slate-400 font-bold block text-[10px] uppercase">PAN Number</span>
                <span className="font-mono font-bold text-slate-900 text-sm mt-0.5 block">{agency.panNumber || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Part 4: Edit Agency Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-3xl my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
              <div className="flex items-center gap-2.5">
                <Edit3 className="h-5 w-5 text-amber-500" />
                <h3 className="font-black text-base">Edit Agency Profile</h3>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {saveErrorMsg && (
              <div className="p-4 mx-6 mt-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-bold">
                {saveErrorMsg}
              </div>
            )}

            <form onSubmit={handleSave} className="p-6 space-y-6 text-xs font-medium max-h-[75vh] overflow-y-auto">
              {/* Basic Details */}
              <div className="space-y-4">
                <h4 className="font-black text-slate-900 uppercase tracking-wider text-[11px] border-b pb-2">Basic Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-extrabold text-slate-800 block mb-1">Agency Name</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="font-extrabold text-slate-800 block mb-1">Status</label>
                    <select
                      value={status}
                      onChange={e => setStatus(e.target.value as AgencyStatus)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                    >
                      <option value={AgencyStatus.ACTIVE}>ACTIVE</option>
                      <option value={AgencyStatus.TRIAL}>TRIAL</option>
                      <option value={AgencyStatus.SUSPENDED}>SUSPENDED</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-extrabold text-slate-800 block mb-1">Owner Name</label>
                    <input
                      type="text"
                      value={ownerName}
                      onChange={e => setOwnerName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="font-extrabold text-slate-800 block mb-1">Owner Email</label>
                    <input
                      type="email"
                      value={ownerEmail}
                      onChange={e => setOwnerEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Feature Access Controls */}
              <div className="space-y-4">
                <h4 className="font-black text-slate-900 uppercase tracking-wider text-[11px] border-b pb-2">Feature Access Controls</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="font-bold text-slate-800">Website Builder Access</span>
                    <button
                      type="button"
                      onClick={() => setWebsiteBuilderEnabled(!websiteBuilderEnabled)}
                      className={`px-3 py-1 rounded-lg text-[11px] font-extrabold transition-all ${
                        websiteBuilderEnabled ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-700'
                      }`}
                    >
                      {websiteBuilderEnabled ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="font-bold text-slate-800">Widget Access</span>
                    <button
                      type="button"
                      onClick={() => setWidgetEnabled(!widgetEnabled)}
                      className={`px-3 py-1 rounded-lg text-[11px] font-extrabold transition-all ${
                        widgetEnabled ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-700'
                      }`}
                    >
                      {widgetEnabled ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Subscription Details */}
              <div className="space-y-4">
                <h4 className="font-black text-slate-900 uppercase tracking-wider text-[11px] border-b pb-2">Subscription Info</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="font-extrabold text-slate-800 block mb-1">Plan Tier</label>
                    <select
                      value={plan}
                      onChange={e => setPlan(e.target.value as SubscriptionTier)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                    >
                      <option value={SubscriptionTier.STARTER}>STARTER</option>
                      <option value={SubscriptionTier.GROWTH}>GROWTH</option>
                      <option value={SubscriptionTier.ENTERPRISE}>ENTERPRISE</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-extrabold text-slate-800 block mb-1">Start Date</label>
                    <input
                      type="date"
                      value={subscriptionStartDate}
                      onChange={e => setSubscriptionStartDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="font-extrabold text-slate-800 block mb-1">Expiry Date</label>
                    <input
                      type="date"
                      value={subscriptionExpiryDate}
                      onChange={e => setSubscriptionExpiryDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Business Details */}
              <div className="space-y-4">
                <h4 className="font-black text-slate-900 uppercase tracking-wider text-[11px] border-b pb-2">Business Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-extrabold text-slate-800 block mb-1">Website URL</label>
                    <input
                      type="url"
                      value={websiteUrl}
                      onChange={e => setWebsiteUrl(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="font-extrabold text-slate-800 block mb-1">Business Email</label>
                    <input
                      type="email"
                      value={businessEmail}
                      onChange={e => setBusinessEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="font-extrabold text-slate-800 block mb-1">Support Email</label>
                    <input
                      type="email"
                      value={supportEmail}
                      onChange={e => setSupportEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="font-extrabold text-slate-800 block mb-1">Phone</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="font-extrabold text-slate-800 block mb-1">Alternate Phone</label>
                    <input
                      type="text"
                      value={alternatePhone}
                      onChange={e => setAlternatePhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="font-extrabold text-slate-800 block mb-1">City</label>
                    <input
                      type="text"
                      value={city}
                      onChange={e => setCity(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="font-extrabold text-slate-800 block mb-1">State</label>
                    <input
                      type="text"
                      value={state}
                      onChange={e => setState(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="font-extrabold text-slate-800 block mb-1">Country</label>
                    <input
                      type="text"
                      value={country}
                      onChange={e => setCountry(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="font-extrabold text-slate-800 block mb-1">Address</label>
                    <input
                      type="text"
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="font-extrabold text-slate-800 block mb-1">Company Description</label>
                    <textarea
                      rows={2}
                      value={companyDescription}
                      onChange={e => setCompanyDescription(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Legal Details */}
              <div className="space-y-4">
                <h4 className="font-black text-slate-900 uppercase tracking-wider text-[11px] border-b pb-2">Legal Identifiers</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="font-extrabold text-slate-800 block mb-1">GST Number</label>
                    <input
                      type="text"
                      value={gstNumber}
                      onChange={e => setGstNumber(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="font-extrabold text-slate-800 block mb-1">CIN Number</label>
                    <input
                      type="text"
                      value={cinNumber}
                      onChange={e => setCinNumber(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="font-extrabold text-slate-800 block mb-1">PAN Number</label>
                    <input
                      type="text"
                      value={panNumber}
                      onChange={e => setPanNumber(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 font-extrabold text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black shadow-md transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {isPending ? (
                    <span className="h-4 w-4 border-2 border-slate-950/40 border-t-slate-950 rounded-full animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
