import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@supabase/supabase-js';
import { env } from '@/env';
import { STORAGE_BUCKETS } from '@/lib/storage';

export const revalidate = 0;

const supabaseAdmin = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
);

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
    const { data: blob, error } = await supabaseAdmin.storage
      .from(bucket)
      .download(doc.filePath);

    if (!error && blob) {
      const buffer = Buffer.from(await blob.arrayBuffer());
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': doc.mimeType || 'application/pdf',
          'Content-Disposition': `inline; filename="${doc.fileName}"`,
          'Cache-Control': 'public, max-age=3600'
        }
      });
    }

    // Fallback: Redirect to public Supabase Storage URL
    const { data: urlData } = supabaseAdmin.storage.from(bucket).getPublicUrl(doc.filePath);
    if (urlData?.publicUrl) {
      return NextResponse.redirect(urlData.publicUrl);
    }

    return NextResponse.json({ error: 'Failed to retrieve document binary from storage' }, { status: 500 });
  } catch (err: any) {
    console.error('Error fetching candidate document:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
