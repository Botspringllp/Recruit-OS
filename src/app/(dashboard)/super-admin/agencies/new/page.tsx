'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createAgencyAction } from '@/app/actions/agencies';
import { SubscriptionTier } from '@prisma/client';
import { Building2, ArrowLeft, Shield, CheckCircle, AlertCircle, Key, Mail, User } from 'lucide-react';

export default function CreateAgencyWizardPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [temporaryPassword, setTemporaryPassword] = useState('TempPass123!');
  const [plan, setPlan] = useState<SubscriptionTier>(SubscriptionTier.ENTERPRISE);

  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleNameChange = (val: string) => {
    setName(val);
    if (!subdomain) {
      const slug = val.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
      setSubdomain(slug);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    startTransition(async () => {
      const res = await createAgencyAction({
        name,
        subdomain,
        ownerName,
        ownerEmail,
        temporaryPassword,
        plan
      });

      if (res.success) {
        router.push('/super-admin');
        router.refresh();
      } else {
        setErrorMessage(res.error || 'Failed to provision agency tenant.');
      }
    });
  };

  return (
    <div className="bg-slate-50 min-h-screen p-6 sm:p-8 space-y-8 text-slate-900 max-w-3xl mx-auto">
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
              Create an isolated agency workspace and provision its initial Agency Owner account.
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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Agency Metadata */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-amber-500" />
            1. Agency Tenant Profile
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-800 block">
                Agency Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Apex Talent Solutions"
                value={name}
                onChange={e => handleNameChange(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/20 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-800 block">
                Subdomain Slug <span className="text-rose-500">*</span>
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  required
                  placeholder="apex"
                  value={subdomain}
                  onChange={e => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/20 transition-all pr-32"
                />
                <span className="absolute right-3.5 text-[11px] font-mono font-bold text-slate-400">
                  .recruitos.com
                </span>
              </div>
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
          </div>
        </div>

        {/* Section 2: Owner Credentials */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
            <User className="h-4 w-4 text-amber-500" />
            2. Initial Agency Owner Account
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
                Temporary Password <span className="text-rose-500">*</span>
              </label>
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={temporaryPassword}
                onChange={e => setTemporaryPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/20 transition-all"
              />
              <p className="text-[10px] text-slate-500 font-medium mt-1">
                Owner will use this initial password to sign in to their agency cockpit.
              </p>
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
