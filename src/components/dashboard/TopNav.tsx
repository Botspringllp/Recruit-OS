'use client';

import React from 'react';
import { Menu, Bell } from 'lucide-react';
import { TenantBadge } from './TenantBadge';
import { UserProfileDropdown } from './UserProfileDropdown';
import { InlineGlobalSearch } from './InlineGlobalSearch';
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
      {/* Left: Mobile Toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-950 hover:bg-slate-100 transition-colors"
          aria-label="Open Mobile Navigation"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Middle: Direct Active Inline Search Input */}
      <div className="hidden md:flex flex-1 max-w-lg mx-4 justify-center">
        <InlineGlobalSearch />
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
