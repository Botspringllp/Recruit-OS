import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { PublicWidgetForm } from '@/components/widget/PublicWidgetForm';
import { AlertTriangle, Lock } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface WidgetPreviewPageProps {
  params: Promise<{ agencyId: string }>;
}

export default async function WidgetPreviewPage({ params }: WidgetPreviewPageProps) {
  const { agencyId } = await params;

  if (!agencyId) {
    notFound();
  }

  const agency = await (prisma.agency as any).findUnique({
    where: { id: agencyId },
    select: { id: true, name: true, widgetEnabled: true }
  });

  if (!agency) {
    notFound();
  }

  // Access Control Check (SECTION 8)
  if (agency.widgetEnabled === false) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-white font-sans">
        <div className="max-w-md w-full bg-slate-950 border border-slate-800 rounded-3xl p-8 text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center mx-auto">
            <Lock className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-black text-white">Widget Access Restricted</h2>
          <p className="text-xs text-slate-400 leading-relaxed font-medium">
            Requirement Capture Widget access is disabled for <strong className="text-white">{agency.name}</strong>.
          </p>
          <p className="text-[11px] text-slate-500 bg-slate-900 p-3 rounded-xl border border-slate-800">
            Please contact your platform Super Admin to enable Requirement Capture Widget access.
          </p>
        </div>
      </div>
    );
  }

  return <PublicWidgetForm agencyId={agency.id} agencyName={agency.name} />;
}
