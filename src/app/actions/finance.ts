'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { logEvent } from '@/lib/logger';

async function getDemoAgencyId(): Promise<string> {
  const agency = await prisma.agency.findFirst({
    where: { subdomain: 'demo' },
    select: { id: true }
  });
  if (!agency) {
    logEvent.authFailure('Demo agency contextual record not found');
    throw new Error('Default agency contextual record not found');
  }
  return agency.id;
}

export type FinanceActionResult = {
  success: boolean;
  invoiceId?: string;
  error?: string;
  errors?: Record<string, string>;
};

// Automatic Invoice Generation when Offer status becomes JOINED
export async function autoGenerateInvoiceForOffer(offerId: string): Promise<FinanceActionResult> {
  try {
    const agencyId = await getDemoAgencyId();

    const offer = await prisma.jobOfferAudit.findFirst({
      where: { id: offerId, agencyId },
      include: {
        submission: {
          include: {
            job: {
              include: { client: true }
            },
            candidate: true
          }
        }
      }
    });

    if (!offer) {
      return { success: false, error: 'Offer audit record not found.' };
    }

    const clientId = offer.submission.job.clientId || offer.submission.job.client?.id;
    if (!clientId) {
      return { success: false, error: 'Mandate client association missing.' };
    }

    // Check if an invoice already exists for this offer audit
    const existing = await prisma.invoiceRecord.findFirst({
      where: { auditId: offer.id, agencyId }
    });

    if (existing) {
      return { success: true, invoiceId: existing.id };
    }

    // Calculate Base Fee: Offered Total CTC * Fee Percentage
    const totalCtc = offer.totalOfferedCtc
      ? parseFloat(offer.totalOfferedCtc.toString())
      : (offer.offeredFixedCtc ? parseFloat(offer.offeredFixedCtc.toString()) : 0) +
        (offer.offeredVariableCtc ? parseFloat(offer.offeredVariableCtc.toString()) : 0);

    const feePercentage = offer.submission.job.feePercentage
      ? parseFloat(offer.submission.job.feePercentage.toString())
      : (offer.submission.job.client?.standardFeePercentage
          ? parseFloat(offer.submission.job.client.standardFeePercentage.toString())
          : 8.33);

    // Offered CTC is in LPA (e.g. 24.50 LPA = 24,50,000 INR)
    const annualCtcAmount = totalCtc > 100 ? totalCtc : totalCtc * 100000;
    const baseFeeAmount = (annualCtcAmount * feePercentage) / 100;
    const gstPercentage = 18.0;
    const gstAmount = (baseFeeAmount * gstPercentage) / 100;
    const totalInvoiceAmount = baseFeeAmount + gstAmount;

    // Generate unique invoice number: INV-YYYYMMDD-XXXX
    const invoiceCount = await prisma.invoiceRecord.count({ where: { agencyId } });
    const yearStr = new Date().getFullYear();
    const invoiceNumber = `INV-${yearStr}-${String(invoiceCount + 1).padStart(4, '0')}`;

    // Calculate Due Date (Default payment terms: client paymentTermsDays or 30 days)
    const paymentTermsDays = offer.submission.job.client?.paymentTermsDays || 30;
    const joiningDate = offer.joiningDate ? new Date(offer.joiningDate) : new Date();
    const dueDate = new Date(joiningDate.getTime() + paymentTermsDays * 24 * 60 * 60 * 1000);

    const invoice = await prisma.invoiceRecord.create({
      data: {
        agencyId,
        clientId,
        auditId: offer.id,
        jobId: offer.submission.jobId,
        submissionId: offer.submissionId,
        offerId: offer.id,
        invoiceNumber,
        baseFeeAmount: new Prisma.Decimal(baseFeeAmount.toFixed(2)),
        gstPercentage: new Prisma.Decimal(gstPercentage.toFixed(2)),
        gstAmount: new Prisma.Decimal(gstAmount.toFixed(2)),
        totalInvoiceAmount: new Prisma.Decimal(totalInvoiceAmount.toFixed(2)),
        amountReceived: new Prisma.Decimal('0.00'),
        balanceDue: new Prisma.Decimal(totalInvoiceAmount.toFixed(2)),
        currency: 'INR',
        invoiceStatus: 'GENERATED',
        issuedDate: new Date(),
        dueDate,
        notes: `Automated placement fee invoice generated for candidate ${offer.submission.candidate.firstName} ${offer.submission.candidate.lastName} on ${offer.submission.job.title}.`
      }
    });

    logEvent.invoiceEvent('CREATED', invoice.id, agencyId, {
      invoiceNumber,
      totalAmount: totalInvoiceAmount,
      candidateId: offer.submission.candidateId,
      jobId: offer.submission.jobId
    });

    revalidatePath('/finance');
    revalidatePath('/cockpit');

    return { success: true, invoiceId: invoice.id };
  } catch (err: any) {
    logEvent.dbFailure('autoGenerateInvoiceForOffer', err);
    return { success: false, error: err.message || 'Failed to generate placement invoice' };
  }
}

export async function createInvoiceAction(prevState: any, formData: FormData): Promise<FinanceActionResult> {
  try {
    const agencyId = await getDemoAgencyId();

    const clientId = (formData.get('clientId') as string || '').trim();
    const jobId = (formData.get('jobId') as string || '').trim();
    const submissionId = (formData.get('submissionId') as string || '').trim();
    const baseFeeAmountRaw = (formData.get('baseFeeAmount') as string || '').trim();
    const gstPercentageRaw = (formData.get('gstPercentage') as string || '18').trim();
    const dueDateRaw = (formData.get('dueDate') as string || '').trim();
    const notes = (formData.get('notes') as string || '').trim();

    const errors: Record<string, string> = {};

    if (!clientId) errors.clientId = 'Client company selection is required';

    const baseFeeAmount = parseFloat(baseFeeAmountRaw);
    if (isNaN(baseFeeAmount) || baseFeeAmount <= 0) {
      errors.baseFeeAmount = 'Base fee amount must be greater than 0';
    }

    const gstPercentage = parseFloat(gstPercentageRaw) || 18.0;
    if (gstPercentage < 0) errors.gstPercentage = 'GST percentage cannot be negative';

    let dueDate: Date | null = null;
    if (!dueDateRaw) {
      errors.dueDate = 'Invoice due date is required';
    } else {
      dueDate = new Date(dueDateRaw);
      if (isNaN(dueDate.getTime())) errors.dueDate = 'Invalid due date format';
    }

    if (Object.keys(errors).length > 0) {
      return { success: false, errors };
    }

    const gstAmount = (baseFeeAmount * gstPercentage) / 100;
    const totalInvoiceAmount = baseFeeAmount + gstAmount;

    const invoiceCount = await prisma.invoiceRecord.count({ where: { agencyId } });
    const yearStr = new Date().getFullYear();
    const invoiceNumber = `INV-${yearStr}-${String(invoiceCount + 1).padStart(4, '0')}`;

    const invoice = await prisma.invoiceRecord.create({
      data: {
        agencyId,
        clientId,
        jobId: jobId || null,
        submissionId: submissionId || null,
        invoiceNumber,
        baseFeeAmount: new Prisma.Decimal(baseFeeAmount.toFixed(2)),
        gstPercentage: new Prisma.Decimal(gstPercentage.toFixed(2)),
        gstAmount: new Prisma.Decimal(gstAmount.toFixed(2)),
        totalInvoiceAmount: new Prisma.Decimal(totalInvoiceAmount.toFixed(2)),
        amountReceived: new Prisma.Decimal('0.00'),
        balanceDue: new Prisma.Decimal(totalInvoiceAmount.toFixed(2)),
        currency: 'INR',
        invoiceStatus: 'GENERATED',
        issuedDate: new Date(),
        dueDate: dueDate!,
        notes: notes || null
      }
    });

    revalidatePath('/finance');

    return { success: true, invoiceId: invoice.id };
  } catch (err: any) {
    console.error('Error creating invoice:', err);
    return { success: false, error: err.message || 'Failed to create invoice' };
  }
}

export async function updateInvoiceAction(invoiceId: string, formData: FormData): Promise<FinanceActionResult> {
  try {
    const agencyId = await getDemoAgencyId();

    const baseFeeAmountRaw = (formData.get('baseFeeAmount') as string || '').trim();
    const gstPercentageRaw = (formData.get('gstPercentage') as string || '18').trim();
    const dueDateRaw = (formData.get('dueDate') as string || '').trim();
    const invoiceStatus = (formData.get('invoiceStatus') as string || 'DRAFT').trim();
    const notes = (formData.get('notes') as string || '').trim();

    const errors: Record<string, string> = {};

    const baseFeeAmount = parseFloat(baseFeeAmountRaw);
    if (isNaN(baseFeeAmount) || baseFeeAmount <= 0) {
      errors.baseFeeAmount = 'Base fee amount must be greater than 0';
    }

    const gstPercentage = parseFloat(gstPercentageRaw) || 18.0;

    let dueDate: Date | null = null;
    if (!dueDateRaw) {
      errors.dueDate = 'Due date is required';
    } else {
      dueDate = new Date(dueDateRaw);
      if (isNaN(dueDate.getTime())) errors.dueDate = 'Invalid due date';
    }

    if (Object.keys(errors).length > 0) {
      return { success: false, errors };
    }

    const existing = await prisma.invoiceRecord.findFirst({
      where: { id: invoiceId, agencyId }
    });

    if (!existing) {
      return { success: false, error: 'Invoice record not found or access denied.' };
    }

    const gstAmount = (baseFeeAmount * gstPercentage) / 100;
    const totalInvoiceAmount = baseFeeAmount + gstAmount;
    const amountReceived = parseFloat(existing.amountReceived.toString()) || 0;
    const balanceDue = Math.max(0, totalInvoiceAmount - amountReceived);

    let finalStatus = invoiceStatus;
    if (balanceDue <= 0 && totalInvoiceAmount > 0) {
      finalStatus = 'PAID';
    } else if (amountReceived > 0 && balanceDue > 0) {
      finalStatus = 'PARTIALLY_PAID';
    }

    await prisma.invoiceRecord.update({
      where: { id: invoiceId },
      data: {
        baseFeeAmount: new Prisma.Decimal(baseFeeAmount.toFixed(2)),
        gstPercentage: new Prisma.Decimal(gstPercentage.toFixed(2)),
        gstAmount: new Prisma.Decimal(gstAmount.toFixed(2)),
        totalInvoiceAmount: new Prisma.Decimal(totalInvoiceAmount.toFixed(2)),
        balanceDue: new Prisma.Decimal(balanceDue.toFixed(2)),
        invoiceStatus: finalStatus,
        dueDate: dueDate!,
        notes: notes || null
      }
    });

    revalidatePath('/finance');
    revalidatePath(`/finance/${invoiceId}`);

    return { success: true, invoiceId };
  } catch (err: any) {
    console.error('Error updating invoice:', err);
    return { success: false, error: err.message || 'Failed to update invoice' };
  }
}

export async function updateInvoiceStatusAction(invoiceId: string, newStatus: string): Promise<FinanceActionResult> {
  try {
    const agencyId = await getDemoAgencyId();

    const existing = await prisma.invoiceRecord.findFirst({
      where: { id: invoiceId, agencyId }
    });

    if (!existing) {
      return { success: false, error: 'Invoice record not found or access denied.' };
    }

    const updateData: any = { invoiceStatus: newStatus };
    if (newStatus === 'PAID') {
      updateData.paidAt = new Date();
      updateData.amountReceived = existing.totalInvoiceAmount;
      updateData.balanceDue = new Prisma.Decimal('0.00');
    }

    await prisma.invoiceRecord.update({
      where: { id: invoiceId },
      data: updateData
    });

    revalidatePath('/finance');
    revalidatePath(`/finance/${invoiceId}`);

    return { success: true, invoiceId };
  } catch (err: any) {
    console.error('Error updating invoice status:', err);
    return { success: false, error: err.message || 'Failed to update invoice status' };
  }
}

export async function recordPaymentAction(invoiceId: string, formData: FormData): Promise<FinanceActionResult> {
  try {
    const agencyId = await getDemoAgencyId();

    const paymentAmountRaw = (formData.get('paymentAmount') as string || '').trim();
    const paymentDateRaw = (formData.get('paymentDate') as string || '').trim();
    const referenceNumber = (formData.get('referenceNumber') as string || '').trim();
    const paymentNotes = (formData.get('notes') as string || '').trim();

    const paymentAmount = parseFloat(paymentAmountRaw);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      return { success: false, error: 'Payment amount must be a positive value.' };
    }

    const existing = await prisma.invoiceRecord.findFirst({
      where: { id: invoiceId, agencyId }
    });

    if (!existing) {
      return { success: false, error: 'Invoice record not found or access denied.' };
    }

    const currentReceived = parseFloat(existing.amountReceived.toString()) || 0;
    const totalAmount = parseFloat(existing.totalInvoiceAmount.toString()) || 0;

    const newReceived = currentReceived + paymentAmount;
    const newBalance = Math.max(0, totalAmount - newReceived);

    let newStatus = existing.invoiceStatus;
    let paidAt: Date | null = existing.paidAt;

    if (newBalance <= 0) {
      newStatus = 'PAID';
      paidAt = paymentDateRaw ? new Date(paymentDateRaw) : new Date();
    } else if (newReceived > 0) {
      newStatus = 'PARTIALLY_PAID';
    }

    const appendedNotes = `${existing.notes || ''}\n[Payment Recorded: ₹${paymentAmount.toLocaleString('en-IN')} on ${
      paymentDateRaw || new Date().toISOString().split('T')[0]
    } | Ref: ${referenceNumber || 'N/A'}] ${paymentNotes}`.trim();

    await prisma.invoiceRecord.update({
      where: { id: invoiceId },
      data: {
        amountReceived: new Prisma.Decimal(newReceived.toFixed(2)),
        balanceDue: new Prisma.Decimal(newBalance.toFixed(2)),
        invoiceStatus: newStatus,
        paidAt,
        notes: appendedNotes
      }
    });

    logEvent.invoiceEvent('PAYMENT_RECORDED', invoiceId, agencyId, {
      paymentAmount,
      newStatus,
      newBalance,
      referenceNumber
    });

    revalidatePath('/finance');
    revalidatePath(`/finance/${invoiceId}`);

    return { success: true, invoiceId };
  } catch (err: any) {
    logEvent.dbFailure('recordPaymentAction', err);
    return { success: false, error: err.message || 'Failed to record payment' };
  }
}
