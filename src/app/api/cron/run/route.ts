import { NextRequest, NextResponse } from 'next/server';
import { runAllAutomationJobs, runSingleAutomationJob } from '@/lib/automation/scheduler';

function isCronAuthorized(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET || 'recruitos_default_cron_secret_2026';

  // 1. Header: Authorization: Bearer <CRON_SECRET>
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    if (token === cronSecret) return true;
  }

  // 2. Header: x-cron-secret
  const customHeader = req.headers.get('x-cron-secret');
  if (customHeader === cronSecret) return true;

  // 3. Query Param: ?secret=<CRON_SECRET>
  const urlSecret = req.nextUrl.searchParams.get('secret');
  if (urlSecret === cronSecret) return true;

  return false;
}

export async function GET(req: NextRequest) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized CRON execution' },
      { status: 401 }
    );
  }

  try {
    const singleJob = req.nextUrl.searchParams.get('job');
    if (singleJob) {
      const summary = await runSingleAutomationJob(singleJob);
      return NextResponse.json({
        success: summary.success,
        jobsExecuted: 1,
        processed: summary.processedCount,
        failed: summary.failedCount,
        durationMs: summary.durationMs,
        job: summary
      });
    }

    const summary = await runAllAutomationJobs();
    return NextResponse.json({
      success: summary.success,
      jobsExecuted: summary.jobsExecuted,
      processed: summary.processed,
      failed: summary.failed,
      durationMs: summary.durationMs
    });
  } catch (err: any) {
    console.error('[CRON API Error]:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'CRON execution failed' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
