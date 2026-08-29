'use client';

import React from 'react';
import { Download, Printer } from 'lucide-react';

interface InvoicePdfButtonProps {
  invoiceNumber: string;
}

export function InvoicePdfButton({ invoiceNumber }: InvoicePdfButtonProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <button
      onClick={handlePrint}
      className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition border border-slate-700/80 flex items-center gap-1.5 shadow-sm print:hidden"
    >
      <Printer className="h-3.5 w-3.5 text-indigo-400" />
      Print / Download PDF
    </button>
  );
}
