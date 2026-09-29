import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { env } from '@/env';
import { STORAGE_BUCKETS } from '@/lib/storage';

export const revalidate = 0;

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const docId = params.id;
    if (!docId) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

    const doc = await prisma.candidateDocument.findUnique({
      where: { id: docId }
    });

    if (!doc) {
      return NextResponse.json({ error: 'Document record not found' }, { status: 404 });
    }

    const bucket = STORAGE_BUCKETS.RESUMES;
    const baseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

    if (baseUrl && serviceKey && doc.filePath) {
      try {
        const downloadRes = await fetch(`${baseUrl}/storage/v1/object/authenticated/${bucket}/${doc.filePath}`, {
          headers: {
            'Authorization': `Bearer ${serviceKey}`,
            'apikey': serviceKey
          }
        });

        if (downloadRes.ok) {
          const buffer = Buffer.from(await downloadRes.arrayBuffer());
          return new NextResponse(buffer, {
            headers: {
              'Content-Type': doc.mimeType || 'application/pdf',
              'Content-Disposition': `inline; filename="${doc.fileName}"`,
              'Cache-Control': 'public, max-age=3600'
            }
          });
        }
      } catch (e: any) {
        console.error('Supabase storage fetch failed:', e?.message || e);
      }
    }

    // Return friendly HTML error page instead of redirecting browser to dead DNS host
    const htmlError = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Resume File Unavailable</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; background: #f8fafc; color: #0f172a; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; }
            .card { background: white; border: 1px solid #e2e8f0; padding: 32px; border-radius: 24px; max-width: 480px; text-align: center; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); }
            .icon { font-size: 40px; margin-bottom: 12px; }
            h2 { margin: 0 0 8px 0; font-size: 20px; font-weight: 800; color: #0f172a; }
            p { margin: 0 0 20px 0; font-size: 13px; color: #64748b; line-height: 1.5; }
            .badge { display: inline-block; padding: 6px 14px; background: #fef3c7; color: #92400e; font-weight: 700; font-size: 12px; border-radius: 999px; margin-bottom: 16px; border: 1px solid #fde68a; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="icon">📄</div>
            <div class="badge">Resume Document Storage Issue</div>
            <h2>Unable to Load Resume PDF</h2>
            <p>The PDF document for <strong>${doc.fileName || 'Candidate Resume'}</strong> could not be retrieved from the cloud storage service. The configured storage URL (<code>${baseUrl || 'Supabase Storage'}</code>) is unreachable or expired.</p>
            <p style="font-size: 11px; color: #94a3b8;">Please re-upload this candidate's resume PDF from Candidate Management in RecruitOS.</p>
          </div>
        </body>
      </html>
    `;

    return new NextResponse(htmlError, {
      status: 404,
      headers: { 'Content-Type': 'text/html' }
    });

    return NextResponse.json({ error: 'Failed to retrieve document binary from storage' }, { status: 500 });
  } catch (err: any) {
    console.error('Error fetching candidate document:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
