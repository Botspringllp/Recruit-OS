/**
 * RecruitOS High-Contrast Executive SaaS Theme
 * Combines Deep Slate Executive Sidebar with Crisp White Canvas, Rich Indigo/Amber Accents,
 * and Maximum Readability Status Badges.
 */
export const THEME = {
  colors: {
    bgCanvas: '#F8FAFC',       // Slate 50 Light Canvas
    bgCard: '#FFFFFF',         // Pure White Cards
    bgSidebar: '#0F172A',      // Slate 900 Executive Sidebar
    accentPrimary: '#4F46E5',   // Indigo 600
    accentAmber: '#F59E0B',     // Amber 500
    textPrimary: '#0F172A',     // Slate 900 (High Contrast)
    textSecondary: '#475569',   // Slate 600
    textMuted: '#64748B',       // Slate 500
    borderCard: '#E2E8F0',      // Slate 200
    borderAccent: '#6366F1'     // Indigo 500
  },
  statusBadges: {
    OPEN: 'bg-blue-100 text-blue-900 border border-blue-300 font-extrabold',
    ACTIVE: 'bg-emerald-100 text-emerald-900 border border-emerald-300 font-extrabold',
    PENDING: 'bg-amber-100 text-amber-950 border border-amber-300 font-extrabold',
    REJECTED: 'bg-rose-100 text-rose-900 border border-rose-300 font-extrabold',
    VERIFIED: 'bg-emerald-100 text-emerald-900 border border-emerald-300 font-extrabold',
    PAID: 'bg-emerald-100 text-emerald-900 border border-emerald-300 font-extrabold',
    PARTIALLY_PAID: 'bg-amber-100 text-amber-950 border border-amber-300 font-extrabold',
    SUBMITTED: 'bg-purple-100 text-purple-900 border border-purple-300 font-extrabold',
    UNDER_REVIEW: 'bg-indigo-100 text-indigo-900 border border-indigo-300 font-extrabold'
  },
  buttons: {
    primary: 'bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-600/20 transition-all duration-200 disabled:opacity-50',
    amber: 'bg-amber-400 hover:bg-amber-500 text-slate-950 font-extrabold rounded-xl shadow-md shadow-amber-400/25 transition-all duration-200 disabled:opacity-50',
    secondary: 'bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-bold rounded-xl shadow-2xs transition-all duration-200 disabled:opacity-50',
    danger: 'bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-md shadow-rose-600/20 transition-all duration-200 disabled:opacity-50'
  },
  cards: {
    container: 'bg-white border border-slate-200 rounded-2xl shadow-sm shadow-slate-200/50 hover:shadow-md hover:border-indigo-400/60 transition-all duration-200',
    header: 'px-6 py-4 border-b border-slate-100 flex items-center justify-between',
    body: 'p-6'
  },
  inputs: {
    field: 'w-full bg-white border border-slate-300 rounded-xl p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 font-medium transition-all duration-200',
    label: 'block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2'
  }
} as const;
