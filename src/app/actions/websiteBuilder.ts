'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/rbac';
import { logger } from '@/lib/logger';

export type WebsiteConfigPayload = {
  agencyName?: string;
  tagline?: string;
  logoUrl?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  aboutContent?: string;
  mission?: string;
  vision?: string;
  primaryColor?: string;
  secondaryColor?: string;
  contactEmail?: string;
  supportEmail?: string;
  phone?: string;
  address?: string;
  facebookUrl?: string;
  linkedinUrl?: string;
  instagramUrl?: string;
  twitterUrl?: string;
  selectedServices?: string[];
  selectedIndustries?: string[];
};

export type ActionResult<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
};

const DEFAULT_SERVICES = [
  'Permanent Hiring',
  'Contract Staffing',
  'Executive Search',
  'Leadership Hiring',
  'Campus Hiring',
  'Bulk Hiring',
  'RPO',
  'Recruitment Process Outsourcing'
];

const DEFAULT_INDUSTRIES = [
  'Technology',
  'Healthcare',
  'Fintech',
  'Manufacturing',
  'Telecom',
  'Education',
  'Retail',
  'BFSI',
  'Logistics'
];

export async function getAgencyFeatureFlagsAction(): Promise<{
  websiteBuilderEnabled: boolean;
  widgetEnabled: boolean;
}> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return { websiteBuilderEnabled: false, widgetEnabled: false };

    const roleStr = String(currentUser.role || '').toUpperCase();
    const userAgencyId = currentUser.agencyId || currentUser.agency?.id;

    let agency = null;
    if (userAgencyId) {
      agency = await prisma.agency.findUnique({
        where: { id: userAgencyId },
        select: { websiteBuilderEnabled: true, widgetEnabled: true }
      });
    }

    if (!agency && (roleStr === 'SUPER_ADMIN' || roleStr === 'MASTER_OWNER')) {
      agency = await prisma.agency.findFirst({
        where: { deletedAt: null },
        select: { websiteBuilderEnabled: true, widgetEnabled: true }
      });
    }

    return {
      websiteBuilderEnabled: agency?.websiteBuilderEnabled ?? false,
      widgetEnabled: agency?.widgetEnabled ?? false
    };
  } catch (err) {
    return { websiteBuilderEnabled: false, widgetEnabled: false };
  }
}

async function resolveAuthorizedAgencyId(targetAgencyId?: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error('Unauthorized');

  const roleStr = String(currentUser.role || '').toUpperCase();
  const userAgencyId = currentUser.agencyId || currentUser.agency?.id;

  if (roleStr === 'SUPER_ADMIN' || roleStr === 'MASTER_OWNER') {
    if (targetAgencyId) return { agencyId: targetAgencyId, currentUser };
    if (userAgencyId) return { agencyId: userAgencyId, currentUser };

    const firstAgency = await prisma.agency.findFirst({
      where: { deletedAt: null },
      select: { id: true }
    });
    if (!firstAgency) throw new Error('No agency found');
    return { agencyId: firstAgency.id, currentUser };
  }

  if (!userAgencyId) throw new Error('User has no agency assigned');
  if (targetAgencyId && targetAgencyId !== userAgencyId) {
    throw new Error('Access denied to modify another agency website configuration');
  }

  return { agencyId: userAgencyId, currentUser };
}

export async function getWebsiteConfigurationAction(targetAgencyId?: string): Promise<ActionResult<any>> {
  try {
    const { agencyId } = await resolveAuthorizedAgencyId(targetAgencyId);

    const agency = await prisma.agency.findUnique({
      where: { id: agencyId },
      select: {
        id: true,
        name: true,
        subdomain: true,
        websiteBuilderEnabled: true,
        businessEmail: true,
        supportEmail: true,
        phone: true,
        address: true,
        websiteUrl: true
      }
    });

    if (!agency) {
      return { success: false, error: 'Agency not found' };
    }

    if (agency.websiteBuilderEnabled === false) {
      return {
        success: false,
        error: 'Website Builder Access Disabled. Please contact your platform administrator.'
      };
    }

    let config = await (prisma as any).websiteConfiguration.findUnique({
      where: { agencyId }
    });

    if (!config) {
      const generatedUrl = `${agency.subdomain}.recruitos.site`;
      config = await (prisma as any).websiteConfiguration.create({
        data: {
          agencyId,
          status: 'DRAFT',
          websiteUrl: generatedUrl,
          agencyName: agency.name,
          tagline: 'Leading Recruitment & Talent Solutions Agency',
          heroTitle: `Empowering Business Growth with Top Talent`,
          heroSubtitle: `We connect market-leading organizations with pre-screened, high-caliber professionals. Partner with ${agency.name} for your hiring needs.`,
          aboutContent: `${agency.name} is a premier recruitment consultancy specializing in executive search, contract staffing, and end-to-end talent acquisition services.`,
          mission: `To empower companies with exceptional workforce talent while accelerating career milestones for candidates.`,
          vision: `To be the most trusted, technology-driven recruitment agency partner globally.`,
          primaryColor: '#f59e0b',
          secondaryColor: '#0f172a',
          contactEmail: agency.businessEmail || 'contact@agency.com',
          supportEmail: agency.supportEmail || 'support@agency.com',
          phone: agency.phone || '',
          address: agency.address || '',
          selectedServices: DEFAULT_SERVICES.slice(0, 4),
          selectedIndustries: DEFAULT_INDUSTRIES.slice(0, 4)
        }
      });
    }

    return {
      success: true,
      data: {
        agency,
        config
      }
    };
  } catch (error: any) {
    logger.error({ event: 'GET_WEBSITE_CONFIG_FAILED', error: error.message }, 'Failed to fetch website config');
    return { success: false, error: error.message || 'Failed to fetch website configuration' };
  }
}

export async function saveWebsiteConfigurationAction(
  targetAgencyId: string,
  payload: WebsiteConfigPayload
): Promise<ActionResult<any>> {
  try {
    const { agencyId, currentUser } = await resolveAuthorizedAgencyId(targetAgencyId);

    const agency = await prisma.agency.findUnique({
      where: { id: agencyId },
      select: { id: true, websiteBuilderEnabled: true, subdomain: true }
    });

    if (!agency || agency.websiteBuilderEnabled === false) {
      return { success: false, error: 'Website Builder Access is disabled for this agency.' };
    }

    const generatedUrl = `${agency.subdomain}.recruitos.site`;

    const dataToUpsert: any = {
      agencyName: payload.agencyName?.trim(),
      tagline: payload.tagline?.trim() || null,
      logoUrl: payload.logoUrl?.trim() || null,
      heroTitle: payload.heroTitle?.trim() || null,
      heroSubtitle: payload.heroSubtitle?.trim() || null,
      aboutContent: payload.aboutContent?.trim() || null,
      mission: payload.mission?.trim() || null,
      vision: payload.vision?.trim() || null,
      primaryColor: payload.primaryColor || '#f59e0b',
      secondaryColor: payload.secondaryColor || '#0f172a',
      contactEmail: payload.contactEmail?.trim() || null,
      supportEmail: payload.supportEmail?.trim() || null,
      phone: payload.phone?.trim() || null,
      address: payload.address?.trim() || null,
      facebookUrl: payload.facebookUrl?.trim() || null,
      linkedinUrl: payload.linkedinUrl?.trim() || null,
      instagramUrl: payload.instagramUrl?.trim() || null,
      twitterUrl: payload.twitterUrl?.trim() || null,
      selectedServices: payload.selectedServices || [],
      selectedIndustries: payload.selectedIndustries || [],
      websiteUrl: generatedUrl
    };

    const updatedConfig = await (prisma as any).websiteConfiguration.upsert({
      where: { agencyId },
      create: {
        agencyId,
        status: 'DRAFT',
        ...dataToUpsert
      },
      update: {
        ...dataToUpsert,
        updatedAt: new Date()
      }
    });

    logger.info({
      event: 'WEBSITE_CONFIG_SAVED',
      agencyId,
      userId: currentUser.id
    }, `💾 Website configuration draft saved for agency ${agencyId}`);

    revalidatePath('/settings/website-builder');
    revalidatePath(`/website-preview/${agencyId}`);

    return { success: true, data: updatedConfig };
  } catch (error: any) {
    logger.error({ event: 'SAVE_WEBSITE_CONFIG_FAILED', error: error.message }, 'Failed to save website config');
    return { success: false, error: error.message || 'Failed to save website configuration' };
  }
}

export async function publishWebsiteAction(targetAgencyId: string): Promise<ActionResult<any>> {
  try {
    const { agencyId, currentUser } = await resolveAuthorizedAgencyId(targetAgencyId);

    const agency = await prisma.agency.findUnique({
      where: { id: agencyId },
      select: { id: true, websiteBuilderEnabled: true, subdomain: true }
    });

    if (!agency || agency.websiteBuilderEnabled === false) {
      return { success: false, error: 'Website Builder Access is disabled for this agency.' };
    }

    const config = await (prisma as any).websiteConfiguration.findUnique({
      where: { agencyId }
    });

    if (!config) {
      return { success: false, error: 'Please save your website configuration first before publishing.' };
    }

    if (!config.agencyName || !config.heroTitle) {
      return { success: false, error: 'Agency Name and Hero Title are required to publish website.' };
    }

    const generatedUrl = `${agency.subdomain}.recruitos.site`;

    const updatedConfig = await (prisma as any).websiteConfiguration.update({
      where: { agencyId },
      data: {
        status: 'PUBLISHED',
        websiteUrl: generatedUrl,
        publishedAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Update Agency official websiteUrl field as well
    await prisma.agency.update({
      where: { id: agencyId },
      data: { websiteUrl: generatedUrl }
    });

    logger.info({
      event: 'WEBSITE_PUBLISHED',
      agencyId,
      websiteUrl: generatedUrl,
      userId: currentUser.id
    }, `🚀 Website published for agency ${agencyId} at ${generatedUrl}`);

    revalidatePath('/settings/website-builder');
    revalidatePath(`/site/${agency.subdomain}`);
    revalidatePath(`/website-preview/${agencyId}`);
    revalidatePath('/settings');

    return { success: true, data: updatedConfig };
  } catch (error: any) {
    logger.error({ event: 'PUBLISH_WEBSITE_FAILED', error: error.message }, 'Failed to publish website');
    return { success: false, error: error.message || 'Failed to publish website' };
  }
}

export async function unpublishWebsiteAction(targetAgencyId: string): Promise<ActionResult<any>> {
  try {
    const { agencyId, currentUser } = await resolveAuthorizedAgencyId(targetAgencyId);

    const agency = await prisma.agency.findUnique({
      where: { id: agencyId },
      select: { id: true, websiteBuilderEnabled: true, subdomain: true }
    });

    if (!agency || agency.websiteBuilderEnabled === false) {
      return { success: false, error: 'Website Builder Access is disabled for this agency.' };
    }

    const updatedConfig = await (prisma as any).websiteConfiguration.update({
      where: { agencyId },
      data: {
        status: 'DRAFT',
        updatedAt: new Date()
      }
    });

    logger.info({
      event: 'WEBSITE_UNPUBLISHED',
      agencyId,
      userId: currentUser.id
    }, `🛑 Website unpublished (reverted to DRAFT) for agency ${agencyId}`);

    revalidatePath('/settings/website-builder');
    revalidatePath(`/site/${agency.subdomain}`);
    revalidatePath(`/website-preview/${agencyId}`);
    revalidatePath('/settings');

    return { success: true, data: updatedConfig };
  } catch (error: any) {
    logger.error({ event: 'UNPUBLISH_WEBSITE_FAILED', error: error.message }, 'Failed to unpublish website');
    return { success: false, error: error.message || 'Failed to unpublish website' };
  }
}

export async function getPublicWebsiteDataAction(subdomain: string): Promise<ActionResult<any>> {
  try {
    const cleanSubdomain = (subdomain || '').trim().toLowerCase();

    const agency = await prisma.agency.findFirst({
      where: {
        subdomain: { equals: cleanSubdomain, mode: 'insensitive' },
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        subdomain: true,
        status: true,
        websiteBuilderEnabled: true
      }
    });

    if (!agency) {
      return { success: false, error: 'Agency website not found.' };
    }

    if (agency.status === 'SUSPENDED') {
      return { success: false, error: 'This agency account is currently suspended.' };
    }

    if (agency.websiteBuilderEnabled === false) {
      return { success: false, error: 'Website service is not active for this agency.' };
    }

    const config = await (prisma as any).websiteConfiguration.findUnique({
      where: { agencyId: agency.id }
    });

    if (!config) {
      return { success: false, error: 'Agency website has not been published yet.' };
    }

    // Fetch active open job mandates directly from DB (ZERO mock data!)
    const activeJobs = await prisma.jobMandate.findMany({
      where: {
        agencyId: agency.id,
        status: 'OPEN'
      },
      select: {
        id: true,
        title: true,
        client: { select: { companyName: true } },
        minCtcLpa: true,
        maxCtcLpa: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    const formattedJobs = activeJobs.map((job: any) => ({
      id: job.id,
      positionTitle: job.title,
      companyName: job.client?.companyName || agency.name,
      location: 'Flexible / Remote',
      experience: '2+ Years Required',
      skills: 'Relevant Professional Experience',
      salary: job.minCtcLpa && job.maxCtcLpa ? `₹${job.minCtcLpa} - ₹${job.maxCtcLpa} LPA` : null,
      createdAt: job.createdAt
    }));

    return {
      success: true,
      data: {
        agency,
        config,
        jobs: formattedJobs
      }
    };
  } catch (error: any) {
    logger.error({ event: 'GET_PUBLIC_WEBSITE_FAILED', subdomain, error: error.message }, 'Failed to fetch public website data');
    return { success: false, error: error.message || 'Failed to fetch website data' };
  }
}
