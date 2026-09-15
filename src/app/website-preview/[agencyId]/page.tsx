import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { getWebsiteConfigurationAction, getPublicWebsiteDataAction } from '@/app/actions/websiteBuilder';
import { AgencyWebsiteTemplate } from '@/components/website/AgencyWebsiteTemplate';

export const metadata = {
  title: 'Website Preview | RecruitOS',
  description: 'Live website preview mode for agency website builder'
};

export default async function WebsitePreviewPage({
  params
}: {
  params: Promise<{ agencyId: string }>;
}) {
  const { agencyId } = await params;

  if (!agencyId) {
    notFound();
  }

  const result = await getWebsiteConfigurationAction(agencyId);

  if (!result.success || !result.data) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-center text-white">
        <div className="max-w-md space-y-4">
          <h1 className="text-2xl font-black text-rose-400">Preview Unavailable</h1>
          <p className="text-xs text-slate-300 font-medium">
            {result.error || 'Website configuration could not be loaded for preview.'}
          </p>
        </div>
      </div>
    );
  }

  const { agency, config } = result.data;

  // Fetch live active job mandates for preview
  const publicDataRes = await getPublicWebsiteDataAction(agency.subdomain);
  const jobs = publicDataRes.success && publicDataRes.data?.jobs ? publicDataRes.data.jobs : [];

  return (
    <AgencyWebsiteTemplate
      agency={agency}
      config={config}
      jobs={jobs}
      isPreview={true}
    />
  );
}
