import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/rbac';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Requirement ID is required' }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const isDownload = searchParams.get('download') === 'true';

    // Fetch IncomingRequirement
    let requirement = await (prisma as any).incomingRequirement.findUnique({
      where: { id },
      select: {
        id: true,
        pdfName: true,
        pdfUrl: true,
        companyName: true,
        positionTitle: true
      }
    });

    // If not found directly, check if 'id' is a Job Mandate ID and find linked IncomingRequirement
    if (!requirement) {
      requirement = await (prisma as any).incomingRequirement.findFirst({
        where: { convertedMandateId: id },
        select: {
          id: true,
          pdfName: true,
          pdfUrl: true,
          companyName: true,
          positionTitle: true
        }
      });
    }

    if (!requirement || !requirement.pdfUrl) {
      return new NextResponse('Requirement PDF Document Not Found', { status: 404 });
    }

    const pdfUrl = requirement.pdfUrl;
    const fileName = requirement.pdfName || `Requirement-${requirement.companyName || 'Document'}.pdf`;

    // Handle Data URL (Base64)
    if (pdfUrl.startsWith('data:')) {
      const mimeMatch = pdfUrl.match(/^data:(.*?);base64,/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'application/pdf';
      const base64Data = pdfUrl.replace(/^data:.*?;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      const disposition = isDownload
        ? `attachment; filename="${encodeURIComponent(fileName)}"`
        : `inline; filename="${encodeURIComponent(fileName)}"`;

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': mimeType,
          'Content-Length': buffer.length.toString(),
          'Content-Disposition': disposition,
          'Cache-Control': 'public, max-age=31536000, immutable'
        }
      });
    }

    // If standard URL, redirect or fetch
    if (pdfUrl.startsWith('http://') || pdfUrl.startsWith('https://')) {
      return NextResponse.redirect(pdfUrl);
    }

    return new NextResponse('Invalid PDF format', { status: 400 });
  } catch (error: any) {
    console.error('PDF delivery error:', error);
    return new NextResponse('Internal server error loading PDF', { status: 500 });
  }
}
