import { SlaStatus } from '@prisma/client';

export function calculateSlaStatus(createdAt: Date, updatedAt: Date): SlaStatus {
  const hours = (new Date().getTime() - new Date(updatedAt).getTime()) / (1000 * 60 * 60);
  if (hours < 24) return SlaStatus.HEALTHY;
  if (hours < 48) return SlaStatus.ON_TRACK;
  if (hours < 72) return SlaStatus.AT_RISK;
  if (hours < 96) return SlaStatus.WARNING;
  return SlaStatus.BREACHED;
}
