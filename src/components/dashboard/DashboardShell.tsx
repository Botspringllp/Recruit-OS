'use client';

import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';
import { TenantContextType, UserContextType } from '@/types/dashboard';

interface DashboardShellProps {
  tenant: TenantContextType;
  user: UserContextType;
  children: React.ReactNode;
}

export const DashboardShell: React.FC<DashboardShellProps> = ({ tenant, user, children }) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-900 flex flex-col font-sans selection:bg-amber-400 selection:text-slate-950">
      {/* Sidebar Drawer */}
      <Sidebar
        userRole={user.role}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area Offset by Desktop Sidebar */}
      <div className="lg:pl-64 flex flex-col flex-1 min-w-0 transition-all duration-300">
        {/* Top Navigation */}
        <TopNav
          tenant={tenant}
          user={user}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
        />

        {/* Main Content Body */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6 animate-in fade-in duration-300">
          {children}
        </main>
      </div>
    </div>
  );
};
