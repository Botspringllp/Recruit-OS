'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  CalendarDays,
  ShieldCheck,
  Handshake,
  Receipt,
  Settings,
  Award,
  X
} from 'lucide-react';
import { UserRoleType, NavigationItem } from '@/types/dashboard';

interface SidebarProps {
  userRole: UserRoleType;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  slaWarningCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  userRole,
  isOpenMobile,
  onCloseMobile,
  slaWarningCount = 3
}) => {
  const pathname = usePathname() || '/cockpit';

  const navigationItems: NavigationItem[] = [
    {
      id: 'cockpit',
      label: 'Recruiter Cockpit',
      href: '/cockpit',
      icon: 'LayoutDashboard',
      rolesAllowed: ['AGENCY_FOUNDER', 'RECRUITER', 'FINANCE_ADMIN']
    },
    {
      id: 'candidates',
      label: 'Candidate Repository',
      href: '/candidates',
      icon: 'Users',
      rolesAllowed: ['AGENCY_FOUNDER', 'RECRUITER']
    },
    {
      id: 'jobs',
      label: 'Job Mandates',
      href: '/jobs',
      icon: 'Briefcase',
      rolesAllowed: ['AGENCY_FOUNDER', 'RECRUITER']
    },
    {
      id: 'interviews',
      label: 'Interviews & Prep',
      href: '/interviews',
      icon: 'CalendarDays',
      rolesAllowed: ['AGENCY_FOUNDER', 'RECRUITER']
    },
    {
      id: 'offers',
      label: 'Offer Management',
      href: '/offers',
      icon: 'Award',
      rolesAllowed: ['AGENCY_FOUNDER', 'RECRUITER']
    },
    {
      id: 'compliance',
      label: 'Compliance Radar',
      href: '/compliance',
      icon: 'ShieldCheck',
      badgeCount: slaWarningCount,
      badgeVariant: 'amber',
      rolesAllowed: ['AGENCY_FOUNDER', 'RECRUITER']
    },
    {
      id: 'partners',
      label: 'Partner Co-Broker',
      href: '/partners',
      icon: 'Handshake',
      rolesAllowed: ['AGENCY_FOUNDER', 'RECRUITER', 'PARTNER_RECRUITER']
    },
    {
      id: 'finance',
      label: 'Finance & Invoices',
      href: '/finance',
      icon: 'Receipt',
      rolesAllowed: ['AGENCY_FOUNDER', 'FINANCE_ADMIN']
    },
    {
      id: 'settings',
      label: 'Agency Settings',
      href: '/settings',
      icon: 'Settings',
      rolesAllowed: ['AGENCY_FOUNDER']
    }
  ];

  const filteredNav = navigationItems.filter(item => item.rolesAllowed.includes(userRole));

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'LayoutDashboard':
        return <LayoutDashboard className="h-4.5 w-4.5" />;
      case 'Users':
        return <Users className="h-4.5 w-4.5" />;
      case 'Briefcase':
        return <Briefcase className="h-4.5 w-4.5" />;
      case 'CalendarDays':
        return <CalendarDays className="h-4.5 w-4.5" />;
      case 'Award':
        return <Award className="h-4.5 w-4.5" />;
      case 'ShieldCheck':
        return <ShieldCheck className="h-4.5 w-4.5" />;
      case 'Handshake':
        return <Handshake className="h-4.5 w-4.5" />;
      case 'Receipt':
        return <Receipt className="h-4.5 w-4.5" />;
      default:
        return <Settings className="h-4.5 w-4.5" />;
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#0F172A] border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header with Direct Custom Logo (No background or round container) */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-800/80">
          <a href="/cockpit" className="flex items-center gap-2.5 group">
            <img
              src="/recruitos-logo.png"
              alt="RecruitOS Brand Logo"
              className="h-12 w-auto object-contain group-hover:scale-105 transition-transform duration-200"
            />
            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-tight text-white flex items-center gap-1">
                Recruit<span className="text-amber-400">OS</span>
              </span>
              <span className="text-[9px] font-extrabold uppercase tracking-widest text-amber-400">
                Enterprise SaaS
              </span>
            </div>
          </a>

          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
            Navigation Menu
          </div>

          {filteredNav.map(item => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

            return (
              <a
                key={item.id}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 group ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`${isActive ? 'text-slate-950' : 'text-slate-400 group-hover:text-amber-400'} transition-colors`}>
                    {renderIcon(item.icon)}
                  </span>
                  <span>{item.label}</span>
                </div>

                {item.badgeCount !== undefined && item.badgeCount > 0 && (
                  <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-full ${
                    isActive ? 'bg-slate-950 text-amber-400' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {item.badgeCount}
                  </span>
                )}
              </a>
            );
          })}
        </div>

        {/* Footer Tenant Shield Indicator */}
        <div className="p-3.5 m-3 rounded-2xl bg-slate-900/90 border border-slate-800">
          <div className="flex items-center gap-2 text-xs text-emerald-400 font-extrabold mb-1">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            <span>Tenant Isolated</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-normal">
            PostgreSQL RLS boundary active & validated.
          </p>
        </div>
      </aside>
    </>
  );
};
