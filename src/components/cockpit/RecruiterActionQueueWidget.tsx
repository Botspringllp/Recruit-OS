'use client';

import React from 'react';
import Link from 'next/link';
import {
  FileQuestion,
  CalendarClock,
  MessageSquareQuote,
  UserCheck,
  ArrowRight,
  ListTodo
} from 'lucide-react';
import { RecruiterActionQueueItem } from '@/types/cockpit';

interface RecruiterActionQueueWidgetProps {
  items: RecruiterActionQueueItem[];
}

export const RecruiterActionQueueWidget: React.FC<RecruiterActionQueueWidgetProps> = ({ items }) => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'FileQuestion':
        return <FileQuestion className="h-5 w-5 text-amber-600" />;
      case 'CalendarClock':
        return <CalendarClock className="h-5 w-5 text-indigo-600" />;
      case 'MessageSquareQuote':
        return <MessageSquareQuote className="h-5 w-5 text-purple-600" />;
      case 'UserCheck':
        return <UserCheck className="h-5 w-5 text-emerald-600" />;
      default:
        return <ListTodo className="h-5 w-5 text-indigo-600" />;
    }
  };

  const getBadgeStyle = (variant: string) => {
    switch (variant) {
      case 'amber':
        return 'bg-amber-100 text-amber-950 border-amber-300';
      case 'purple':
        return 'bg-purple-100 text-purple-950 border-purple-300';
      case 'emerald':
        return 'bg-emerald-100 text-emerald-950 border-emerald-300';
      case 'rose':
        return 'bg-rose-100 text-rose-950 border-rose-300';
      default:
        return 'bg-indigo-100 text-indigo-950 border-indigo-300';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600">
            <ListTodo className="h-4.5 w-4.5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 tracking-tight">Recruiter Action Queue</h3>
            <p className="text-[11px] text-slate-600 font-semibold">
              Action items requiring your immediate recruiting attention
            </p>
          </div>
        </div>

        <span className="px-2.5 py-0.5 text-[11px] font-black rounded-full bg-slate-100 text-slate-700 border border-slate-300">
          {items.reduce((acc, i) => acc + i.count, 0)} Items Pending
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {items.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 hover:bg-white hover:border-indigo-400 hover:shadow-md transition-all duration-200 group flex flex-col justify-between space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="p-2 rounded-lg bg-white border border-slate-200 shadow-2xs group-hover:scale-105 transition-transform">
                {getIcon(item.iconName)}
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-black border ${getBadgeStyle(item.badgeVariant)}`}>
                {item.count}
              </span>
            </div>

            <div>
              <h4 className="text-xs font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                {item.title}
              </h4>
              <p className="text-[11px] text-slate-600 font-medium line-clamp-1 mt-0.5">
                {item.description}
              </p>
            </div>

            <div className="flex items-center justify-end text-[11px] font-extrabold text-indigo-600 group-hover:text-indigo-700 pt-1">
              <span>View Queue</span>
              <ArrowRight className="h-3 w-3 ml-1 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};
