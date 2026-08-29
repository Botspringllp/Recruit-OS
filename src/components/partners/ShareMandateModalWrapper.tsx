'use client';

import React, { useState } from 'react';
import { Share2 } from 'lucide-react';
import ShareMandateModal from './ShareMandateModal';

interface ShareMandateModalWrapperProps {
  jobs: Array<{ id: string; title: string }>;
  partners: Array<{ id: string; name: string; defaultSplitPercentage: number | string }>;
}

export default function ShareMandateModalWrapper({ jobs, partners }: ShareMandateModalWrapperProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-xs font-semibold hover:brightness-110 transition flex items-center gap-2 shadow-glow-purple"
      >
        <Share2 className="h-4 w-4" />
        Share Mandate
      </button>

      <ShareMandateModal
        jobs={jobs}
        partners={partners}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
