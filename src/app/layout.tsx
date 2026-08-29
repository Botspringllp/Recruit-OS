import React from 'react';
import './globals.css';

export const metadata = {
  title: 'RecruitOS - Enterprise Recruiter Workspace & Execution Engine',
  description: 'AI-Powered Domain-Driven Multi-Tenant Recruiting System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className="bg-[#0b0f19] text-slate-100 antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
