import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser, hasPermission } from '@/lib/rbac';
import { ArrowLeft, Building2 } from 'lucide-react';
import PartnerForm from '@/components/partners/PartnerForm';

export default async function NewPartnerPage() {
  const dbUser = await getCurrentUser();
  if (!dbUser || !hasPermission(dbUser, 'partner.create')) {
    redirect('/403');
  }
  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center gap-3 border-b border-slate-800/80 pb-5">
        <Link
          href="/partners"
          className="p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-xl transition"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Building2 className="h-5 w-5 text-purple-400" />
            Add New Partner Agency
          </h1>
          <p className="text-xs text-slate-400">
            Register a co-broker partner agency for mandate sharing and revenue split tracking
          </p>
        </div>
      </div>

      <PartnerForm />
    </div>
  );
}
