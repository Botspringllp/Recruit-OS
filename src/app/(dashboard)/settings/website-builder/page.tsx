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
      <SettingsHeaderTabs
        websiteBuilderEnabled={agency?.websiteBuilderEnabled ?? true}
        widgetEnabled={agency?.widgetEnabled ?? false}
      />

      <WebsiteBuilderClient agency={agency} initialConfig={config} />
    </div>
  );
}
