import React from 'react';

interface AuditLog {
  id: string;
  previousStatus: string | null;
  newStatus: string;
  actionBy: string;
  remarks: string | null;
  createdAt: Date | string;
}

interface Props {
  candidateName: string;
  auditLogs: AuditLog[];
}

export function CandidateComplianceTimeline({ candidateName, auditLogs }: Props) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
      <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
        <span className="p-1.5 bg-blue-500/10 text-blue-400 rounded-lg">📜</span>
        Audit Trail Timeline — {candidateName}
      </h3>

      {auditLogs.length === 0 ? (
        <p className="text-xs text-slate-500 italic py-4">No audit logs recorded for this candidate yet.</p>
      ) : (
        <div className="relative border-l border-slate-800 ml-4 space-y-6 my-2">
          {auditLogs.map((log) => (
            <div key={log.id} className="relative pl-6">
              <div className="absolute -left-1.5 top-1.5 w-3 h-3 bg-cyan-500 rounded-full border-2 border-slate-900" />
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">
                  {log.previousStatus ? `${log.previousStatus} ➔ ` : ''}
                  <span className="text-cyan-400">{log.newStatus}</span>
                </span>
                <span className="text-[10px] text-slate-500">
                  {new Date(log.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">{log.remarks || 'No remarks provided'}</p>
              <span className="text-[10px] text-slate-500 mt-1 inline-block">By: {log.actionBy}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
