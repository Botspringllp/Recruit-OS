'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Building, Globe, Users, Layout, Mail } from 'lucide-react';
import { getAgencyFeatureFlagsAction } from '@/app/actions/websiteBuilder';

interface SettingsHeaderTabsProps {
  websiteBuilderEnabled?: boolean;
  widgetEnabled?: boolean;
}

export const SettingsHeaderTabs: React.FC<SettingsHeaderTabsProps> = ({
  websiteBuilderEnabled: initialWebsiteBuilder,
  widgetEnabled: initialWidget
}) => {
  const pathname = usePathname() || '';
  const [wbEnabled, setWbEnabled] = useState<boolean>(initialWebsiteBuilder ?? true);
  const [wEnabled, setWEnabled] = useState<boolean>(initialWidget ?? true);

  useEffect(() => {
    if (initialWebsiteBuilder === undefined || initialWidget === undefined) {
      getAgencyFeatureFlagsAction().then(res => {
        setWbEnabled(res.websiteBuilderEnabled);
        setWEnabled(res.widgetEnabled);
      });
    } else {
      setWbEnabled(initialWebsiteBuilder);
      setWEnabled(initialWidget);
    }
  }, [initialWebsiteBuilder, initialWidget]);

  const allTabs = [
    {
      id: 'profile',
      label: 'Organization Profile',
      href: '/settings',
      icon: Building,
      isActive: pathname === '/settings',
      enabled: true
    },
    {
      id: 'builder',
      label: 'Website Builder',
      href: '/settings/website-builder',
      icon: Layout,
      isActive: pathname.includes('/website-builder'),
      enabled: wbEnabled
    },
    {
      id: 'widget',
      label: 'Widget Management',
      href: '/agency-settings/widget',
      icon: Globe,
      isActive: pathname.includes('/widget'),
      enabled: wEnabled
    },
    {
      id: 'users',
      label: 'User & Team Management',
      href: '/settings/users',
      icon: Users,
      isActive: pathname.includes('/users'),
      enabled: true
    },
    {
      id: 'email-settings',
      label: 'Email Settings',
      href: '/settings/email',
      icon: Mail,
      isActive: pathname === '/settings/email',
      enabled: true
    },
    {
      id: 'email-logs',
      label: 'Email Logs',
      href: '/settings/email-logs',
      icon: Mail,
      isActive: pathname.includes('/email-logs'),
      enabled: true
    }
  ];

  const visibleTabs = allTabs.filter(t => t.enabled);

  return (
    <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
      {visibleTabs.map(tab => {
        const Icon = tab.icon;
        return (
          <Link
            key={tab.id}
            href={tab.href}
            className={`px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 transition-all whitespace-nowrap ${
              tab.isActive
                ? 'bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/20'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900'
            }`}
          >
            <Icon className={`h-4 w-4 ${tab.isActive ? 'text-slate-950' : 'text-slate-500'}`} />
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </div>
  );
};
