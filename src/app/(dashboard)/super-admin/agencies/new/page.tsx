'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createAgencyAction } from '@/app/actions/agencies';
import { SubscriptionTier, AgencyStatus } from '@prisma/client';
import { Building2, ArrowLeft, CheckCircle, AlertCircle, User, Eye, EyeOff, Layout, Code2, Globe, FileText, Briefcase } from 'lucide-react';

export default function CreateAgencyWizardPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [temporaryPassword, setTemporaryPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [plan, setPlan] = useState<SubscriptionTier>(SubscriptionTier.ENTERPRISE);
  const [status, setStatus] = useState<AgencyStatus>(AgencyStatus.ACTIVE);

  // New Mandatory Controls (Part 1 & 7)
  const [websiteBuilderEnabled, setWebsiteBuilderEnabled] = useState(false);
  const [widgetEnabled, setWidgetEnabled] = useState(false);

  // Optional Business Information (Part 2)
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [alternatePhone, setAlternatePhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('');
  const [companyDescription, setCompanyDescription] = useState('');

  // Optional Legal Information (Part 2)
  const [gstNumber, setGstNumber] = useState('');
  const [cinNumber, setCinNumber] = useState('');
  const [panNumber, setPanNumber] = useState('');

  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    startTransition(async () => {
      const res = await createAgencyAction({
        name,
        ownerName,
        ownerEmail,
        temporaryPassword,
        plan,
        status,
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
        panNumber
      });

      if (res.success) {
        router.push('/super-admin');
        router.refresh();
      } else {
        setErrorMessage(res.error || (res.errors ? Object.values(res.errors)[0] : 'Failed to provision agency tenant.'));
      }
    });
  };

  return (
    <div className="bg-slate-50 min-h-screen p-6 sm:p-8 space-y-8 text-slate-900 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <Link
            href="/super-admin"
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded-xl transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Building2 className="h-6 w-6 text-amber-500" />
              Provision New Agency Tenant
            </h1>
            <p className="text-xs font-medium text-slate-500 mt-0.5">
              Create an isolated agency workspace, set feature access, and provision initial Agency Owner credentials.
            </p>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-bold flex items-center gap-2.5">
          <AlertCircle className="h-4.5 w-4.5 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
        {/* Section 1: Mandatory Agency Metadata */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-amber-500" />
            1. Mandatory Agency Credentials & Plan
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-extrabold text-slate-800 block">
                Agency Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Apex Talent Solutions"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/20 transition-all"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-extrabold text-slate-800 block">
                Subscription Plan <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { tier: SubscriptionTier.STARTER, label: 'Starter', desc: 'Up to 5 Users' },
                  { tier: SubscriptionTier.GROWTH, label: 'Growth', desc: 'Up to 25 Users' },
                  { tier: SubscriptionTier.ENTERPRISE, label: 'Enterprise', desc: 'Unlimited Users' }
                ].map(item => (
                  <button
                    key={item.tier}
                    type="button"
                    onClick={() => setPlan(item.tier)}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      plan === item.tier
                        ? 'border-amber-500 bg-amber-50/50 text-slate-900 shadow-2xs'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-extrabold text-xs">{item.label}</div>
                    <div className="text-[10px] font-medium text-slate-500">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-extrabold text-slate-800 block">
                Agency Status <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { key: AgencyStatus.ACTIVE, label: 'Active' },
                  { key: AgencyStatus.TRIAL, label: 'Trial' },
                  { key: AgencyStatus.SUSPENDED, label: 'Suspended' }
                ].map(item => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setStatus(item.key)}
                    className={`p-3 rounded-xl border font-black text-xs transition-all text-center ${
                      status === item.key
                        ? 'border-amber-500 bg-amber-50/60 text-slate-900'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Feature Access Controls (Part 1 & Part 7) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
            <Layout className="h-4 w-4 text-amber-500" />
            2. Platform Feature Access Controls
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layout className="h-4 w-4 text-indigo-600" />
                  <span className="font-extrabold text-xs text-slate-900">Website Builder Access</span>
                </div>
                <div className="flex items-center gap-1.5 p-1 bg-slate-200/80 rounded-xl text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setWebsiteBuilderEnabled(true)}
                    className={`px-3 py-1 rounded-lg transition-all ${websiteBuilderEnabled ? 'bg-emerald-600 text-white font-extrabold shadow-2xs' : 'text-slate-600'}`}
                  >
                    Enabled
                  </button>
                  <button
                    type="button"
                    onClick={() => setWebsiteBuilderEnabled(false)}
                    className={`px-3 py-1 rounded-lg transition-all ${!websiteBuilderEnabled ? 'bg-slate-900 text-white font-extrabold shadow-2xs' : 'text-slate-600'}`}
                  >
                    Disabled
                  </button>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                Allow agency to access custom portal and storefront website builder. (Default: Disabled)
              </p>
            </div>

            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Code2 className="h-4 w-4 text-emerald-600" />
                  <span className="font-extrabold text-xs text-slate-900">Widget Access</span>
                </div>
                <div className="flex items-center gap-1.5 p-1 bg-slate-200/80 rounded-xl text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setWidgetEnabled(true)}
                    className={`px-3 py-1 rounded-lg transition-all ${widgetEnabled ? 'bg-emerald-600 text-white font-extrabold shadow-2xs' : 'text-slate-600'}`}
                  >
                    Enabled
                  </button>
                  <button
                    type="button"
                    onClick={() => setWidgetEnabled(false)}
                    className={`px-3 py-1 rounded-lg transition-all ${!widgetEnabled ? 'bg-slate-900 text-white font-extrabold shadow-2xs' : 'text-slate-600'}`}
                  >
                    Disabled
                  </button>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                Allow agency to generate embeddable job application widgets. (Default: Disabled)
              </p>
            </div>
          </div>
        </div>

        {/* Section 3: Owner Credentials */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
            <User className="h-4 w-4 text-amber-500" />
            3. Initial Agency Owner Account
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-800 block">
                Owner Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Michael Scott"
                value={ownerName}
                onChange={e => setOwnerName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/20 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-800 block">
                Owner Work Email <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                placeholder="michael@apex.com"
                value={ownerEmail}
                onChange={e => setOwnerEmail(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/20 transition-all"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-extrabold text-slate-800 block">
                Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative flex items-center">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter password for agency owner..."
                  value={temporaryPassword}
                  onChange={e => setTemporaryPassword(e.target.value)}
                  autoComplete="new-password"
                  className="w-full px-4 py-3 pr-11 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Optional Agency Information (Part 2) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-amber-500" />
              <span>4. Optional Business & Legal Information</span>
            </div>
            <span className="text-[10px] text-slate-400 font-bold lowercase bg-slate-100 px-2 py-0.5 rounded-md">optional</span>
          </h2>

          <div className="space-y-5">
            <h3 className="text-xs font-black text-slate-700 flex items-center gap-1.5">
              <Briefcase className="h-3.5 w-3.5 text-indigo-600" />
              Business Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 block">Website URL</label>
                <input
                  type="url"
                  placeholder="https://apextalent.com"
                  value={websiteUrl}
                  onChange={e => setWebsiteUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-amber-500 focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 block">Business Email</label>
                <input
                  type="email"
                  placeholder="info@apextalent.com"
                  value={businessEmail}
                  onChange={e => setBusinessEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-amber-500 focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 block">Support Email</label>
                <input
                  type="email"
                  placeholder="support@apextalent.com"
                  value={supportEmail}
                  onChange={e => setSupportEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-amber-500 focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 block">Phone</label>
                <input
                  type="text"
                  placeholder="+1 555-0192"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-amber-500 focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 block">Alternate Phone</label>
                <input
                  type="text"
                  placeholder="+1 555-0193"
                  value={alternatePhone}
                  onChange={e => setAlternatePhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-amber-500 focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 block">City</label>
                <input
                  type="text"
                  placeholder="New York"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-amber-500 focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 block">State</label>
                <input
                  type="text"
                  placeholder="NY"
                  value={state}
                  onChange={e => setState(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-amber-500 focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 block">Country</label>
                <input
                  type="text"
                  placeholder="United States"
                  value={country}
                  onChange={e => setCountry(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-amber-500 focus:bg-white"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-[11px] font-bold text-slate-700 block">Address</label>
                <input
                  type="text"
                  placeholder="100 Technology Way, Suite 400"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-amber-500 focus:bg-white"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-[11px] font-bold text-slate-700 block">Company Description</label>
                <textarea
                  rows={2}
                  placeholder="Executive search and tech staffing firm..."
                  value={companyDescription}
                  onChange={e => setCompanyDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-amber-500 focus:bg-white"
                />
              </div>
            </div>

            <h3 className="text-xs font-black text-slate-700 flex items-center gap-1.5 pt-3 border-t border-slate-100">
              <FileText className="h-3.5 w-3.5 text-emerald-600" />
              Legal & Compliance Identifiers
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 block">GST Number</label>
                <input
                  type="text"
                  placeholder="22AAAAA0000A1Z5"
                  value={gstNumber}
                  onChange={e => setGstNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-amber-500 focus:bg-white font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 block">CIN Number</label>
                <input
                  type="text"
                  placeholder="U74999MH2021PTC123456"
                  value={cinNumber}
                  onChange={e => setCinNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-amber-500 focus:bg-white font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 block">PAN Number</label>
                <input
                  type="text"
                  placeholder="ABCDE1234F"
                  value={panNumber}
                  onChange={e => setPanNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-amber-500 focus:bg-white font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/super-admin"
            className="px-5 py-3 rounded-2xl bg-white border border-slate-200 text-slate-700 font-extrabold text-xs hover:bg-slate-100 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {isPending ? (
              <span className="h-4 w-4 border-2 border-slate-950/40 border-t-slate-950 rounded-full animate-spin" />
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                <span>Provision Agency & Create Owner</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
