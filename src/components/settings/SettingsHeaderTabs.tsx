'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Building, Globe, Users } from 'lucide-react';

export const SettingsHeaderTabs: React.FC = () => {
  const pathname = usePathname() || '';

  const tabs = [
    {
      id: 'profile',
      label: 'Organization Profile',
      href: '/settings',
      icon: Building,
      isActive: pathname === '/settings'
    },
    {
      id: 'widget',
      label: 'Website & Widget',
      href: '/agency-settings/widget',
      icon: Globe,
      isActive: pathname.includes('/widget')
    },
    {
      id: 'users',
      label: 'User & Team Management',
      href: '/settings/users',
      icon: Users,
      isActive: pathname.includes('/users')
    }
  ];

  return (
    <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
      {tabs.map(tab => {
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
