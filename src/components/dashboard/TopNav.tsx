'use client';

import React from 'react';
import { Menu, Search, Bell } from 'lucide-react';
import { TenantBadge } from './TenantBadge';
import { UserProfileDropdown } from './UserProfileDropdown';
import { TenantContextType, UserContextType } from '@/types/dashboard';

interface TopNavProps {
  tenant: TenantContextType;
  user: UserContextType;
  onOpenMobileSidebar: () => void;
  unreadNotificationsCount?: number;
}

export const TopNav: React.FC<TopNavProps> = ({
  tenant,
  user,
  onOpenMobileSidebar,
  unreadNotificationsCount = 2
}) => {
  return (
    <header className="h-16 sticky top-0 z-30 bg-white border-b border-slate-200/90 px-4 md:px-6 flex items-center justify-between gap-4 shadow-2xs">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-950 hover:bg-slate-100 transition-colors"
          aria-label="Open Mobile Navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <h1 className="text-sm md:text-base font-extrabold text-slate-900 tracking-tight">
            Recruiter Cockpit
          </h1>
          <span className="hidden sm:inline-block px-2.5 py-0.5 text-[10px] font-extrabold rounded-full bg-amber-100 text-amber-900 border border-amber-300">
            Live Feed
          </span>
        </div>
      </div>

      {/* Middle: Global Search Trigger */}
      <div className="hidden md:flex flex-1 max-w-md mx-4">
        <button
          onClick={() => console.log('Global search triggered')}
          className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-600 hover:text-slate-950 hover:border-indigo-500 text-xs font-medium transition-all duration-200 shadow-2xs"
        >
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-indigo-600" />
            <span>Search candidates, job mandates, or clients...</span>
          </div>
          <kbd className="px-2 py-0.5 text-[10px] font-mono font-bold text-slate-600 bg-white rounded-md border border-slate-300 shadow-2xs">
            Ctrl + K
          </kbd>
        </button>
      </div>

      {/* Right: Tenant Badge, Notification Bell & User Dropdown */}
      <div className="flex items-center gap-3">
        {/* Tenant Badge */}
        <div className="hidden xl:block">
          <TenantBadge tenant={tenant} />
        </div>

        {/* Notification Bell */}
        <button
          className="relative p-2 rounded-xl text-slate-600 hover:text-slate-950 hover:bg-slate-100 transition-colors"
          aria-label="Notifications"
          onClick={() => console.log('Notifications drawer opened')}
        >
          <Bell className="h-5 w-5" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-indigo-600 animate-ping" />
          )}
          {unreadNotificationsCount > 0 && (
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-indigo-600" />
          )}
        </button>

        <div className="h-6 w-[1px] bg-slate-200 hidden sm:block" />

        {/* User Dropdown */}
        <UserProfileDropdown user={user} />
      </div>
    </header>
  );
};
