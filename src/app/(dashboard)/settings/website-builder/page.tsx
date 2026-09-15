import React from 'react';
import { redirect } from 'next/navigation';
import { SettingsHeaderTabs } from '@/components/settings/SettingsHeaderTabs';
import { WebsiteBuilderClient } from '@/components/website/WebsiteBuilderClient';
import { getWebsiteConfigurationAction } from '@/app/actions/websiteBuilder';

export const metadata = {
  title: 'Website Builder | RecruitOS Agency Settings',
  description: 'Manage and publish your agency native website with RecruitOS Website Builder'
};

export default async function WebsiteBuilderPage() {
  const result = await getWebsiteConfigurationAction();

  if (!result.success) {
    redirect('/settings');
  }

  const { agency, config } = result.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Agency Settings</h1>
          <p className="text-xs text-slate-500 font-medium">
            Manage website builder, recruitment widgets, and organization preferences.
          </p>
        </div>
      </div>

      <SettingsHeaderTabs websiteBuilderEnabled={agency?.websiteBuilderEnabled ?? true} />

      <WebsiteBuilderClient agency={agency} initialConfig={config} />
    </div>
  );
}
