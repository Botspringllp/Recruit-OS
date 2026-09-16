import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return new NextResponse('Requirement ID is required', { status: 400 });
    }

    const requirement = await (prisma as any).incomingRequirement.findUnique({
      where: { id },
      select: { pdfUrl: true, pdfName: true, companyName: true }
    });

    if (!requirement || !requirement.pdfUrl) {
      return new NextResponse('Requirement PDF not found', { status: 404 });
    }

    const rawPdf = requirement.pdfUrl;

    // Handle Data URI format
    if (rawPdf.startsWith('data:')) {
      const parts = rawPdf.split(',');
      const base64Data = parts[1] || '';
      const mimeMatch = parts[0].match(/:(.*?);/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'application/pdf';

      const pdfBuffer = Buffer.from(base64Data, 'base64');
      const filename = requirement.pdfName || `${requirement.companyName || 'Requirement'}-Specification.pdf`;

      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': mimeType,
          'Content-Disposition': `inline; filename="${filename}"`,
          'Content-Length': pdfBuffer.length.toString(),
          'Cache-Control': 'public, max-age=3600, must-revalidate'
        }
      });
    }

    // Handle standard HTTP/HTTPS URLs
    if (rawPdf.startsWith('http://') || rawPdf.startsWith('https://')) {
      return NextResponse.redirect(rawPdf);
    }

    return new NextResponse('Invalid PDF data format', { status: 400 });
  } catch (error: any) {
    console.error('Error serving requirement PDF:', error);
    return new NextResponse('Internal server error serving PDF', { status: 500 });
  }
}
