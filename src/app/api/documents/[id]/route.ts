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
      } catch (e) {
        // Fallback to public URL
      }

      const publicUrl = `${baseUrl}/storage/v1/object/public/${bucket}/${doc.filePath}`;
      return NextResponse.redirect(publicUrl);
    }

    return NextResponse.json({ error: 'Failed to retrieve document binary from storage' }, { status: 500 });
  } catch (err: any) {
    console.error('Error fetching candidate document:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
