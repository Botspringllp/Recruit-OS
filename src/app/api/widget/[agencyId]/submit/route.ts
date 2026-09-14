import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Enable CORS for external website widget submissions
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ agencyId: string }> }
) {
  try {
    const { agencyId } = await params;

    if (!agencyId) {
      return NextResponse.json(
        { success: false, error: 'Agency ID parameter is required.' },
        { status: 400, headers: corsHeaders }
      );
    }

    const agency = await (prisma.agency as any).findUnique({
      where: { id: agencyId },
      select: { id: true, name: true, widgetEnabled: true }
    });

    if (!agency) {
      return NextResponse.json(
        { success: false, error: 'Target agency not found.' },
        { status: 404, headers: corsHeaders }
      );
    }

    if (agency.widgetEnabled === false) {
      return NextResponse.json(
        { success: false, error: 'Requirement Capture Widget is disabled for this agency.' },
        { status: 403, headers: corsHeaders }
      );
    }

    const body = await req.json();

    const {
      companyName,
      contactPerson,
      contactEmail,
      contactNumber,
      positionTitle,
      jobDescription,
      industryType,
      employmentType,
      experienceRequired,
      location,
      education,
      skills,
      companyOverview,
      priority
    } = body;

    // Mandatory Field Validation
    if (!companyName || !companyName.trim()) {
      return NextResponse.json({ success: false, error: 'Company Name is required.' }, { status: 400, headers: corsHeaders });
    }
    if (!contactPerson || !contactPerson.trim()) {
      return NextResponse.json({ success: false, error: 'Contact Person is required.' }, { status: 400, headers: corsHeaders });
    }
    if (!contactEmail || !contactEmail.trim()) {
      return NextResponse.json({ success: false, error: 'Business Email is required.' }, { status: 400, headers: corsHeaders });
    }
    if (!contactNumber || !contactNumber.trim()) {
      return NextResponse.json({ success: false, error: 'Phone Number is required.' }, { status: 400, headers: corsHeaders });
    }
    if (!positionTitle || !positionTitle.trim()) {
      return NextResponse.json({ success: false, error: 'Position Title is required.' }, { status: 400, headers: corsHeaders });
    }
    if (!jobDescription || !jobDescription.trim()) {
      return NextResponse.json({ success: false, error: 'Job Description is required.' }, { status: 400, headers: corsHeaders });
    }

    // Create Incoming Requirement Record in Database
    const requirement = await (prisma as any).incomingRequirement.create({
      data: {
        agencyId,
        companyName: companyName.trim(),
        contactPerson: contactPerson.trim(),
        contactEmail: contactEmail.trim(),
        contactNumber: contactNumber.trim(),
        positionTitle: positionTitle.trim(),
        jobDescription: jobDescription.trim(),
        industryType: industryType?.trim() || null,
        employmentType: employmentType?.trim() || 'Full-time',
        experienceRequired: experienceRequired?.trim() || null,
        location: location?.trim() || null,
        education: education?.trim() || null,
        skills: skills?.trim() || null,
        companyOverview: companyOverview?.trim() || null,
        priority: priority || 'Medium',
        source: 'Website',
        status: 'Pending Review'
      }
    });

    // Create initial timeline audit event
    await (prisma as any).requirementTimelineEvent.create({
      data: {
        requirementId: requirement.id,
        title: 'Requirement Received',
        description: 'Requirement Received via Website Widget',
        actorName: 'Website Widget Client'
      }
    });

    const referenceId = `REQ-${requirement.id.slice(0, 8).toUpperCase()}`;

    return NextResponse.json(
      {
        success: true,
        referenceId,
        requirementId: requirement.id,
        message: 'Requirement submitted successfully.'
      },
      { status: 201, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Widget submission error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error processing requirement submission.' },
      { status: 500, headers: corsHeaders }
    );
  }
}
