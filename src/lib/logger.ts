import pino from 'pino';

/**
 * RecruitOS Structured Logger
 * Emits structured JSON logs for observability, audit tracking,
 * server action execution, database failures, and invoice events.
 */

const isProduction = process.env.NODE_ENV === 'production';
const logLevel = process.env.NODE_ENV === 'test' ? 'silent' : isProduction ? 'info' : 'debug';

export const logger = pino({
  level: logLevel,
  base: {
    env: process.env.NODE_ENV || 'development',
    app: 'recruitos'
  },
  timestamp: pino.stdTimeFunctions.isoTime
});

export interface LogContext {
  action?: string;
  agencyId?: string;
  userId?: string;
  candidateId?: string;
  submissionId?: string;
  invoiceId?: string;
  jobId?: string;
  [key: string]: any;
}

/**
 * Helper utility for structured event logging across Server Actions,
 * DB queries, Auth checks, and Financial workflows.
 */
export const logEvent = {
  info: (message: string, context: LogContext = {}) => {
    logger.info(context, message);
  },

  warn: (message: string, context: LogContext = {}) => {
    logger.warn(context, message);
  },

  error: (message: string, error?: any, context: LogContext = {}) => {
    const errorObj = error instanceof Error
      ? { message: error.message, stack: error.stack, name: error.name }
      : error;

    logger.error({ ...context, error: errorObj }, message);
  },

  // Specialized System Event Logger Helpers
  serverAction: (actionName: string, agencyId: string, details: LogContext = {}) => {
    logger.info({ event: 'SERVER_ACTION', action: actionName, agencyId, ...details }, `⚡ [Server Action] Executed: ${actionName}`);
  },

  dbFailure: (queryContext: string, error: any, agencyId?: string) => {
    const errorObj = error instanceof Error ? { message: error.message, stack: error.stack } : error;
    logger.error({ event: 'DATABASE_FAILURE', queryContext, agencyId, error: errorObj }, `❌ [DB Failure] ${queryContext}`);
  },

  authFailure: (reason: string, details: LogContext = {}) => {
    logger.warn({ event: 'AUTH_FAILURE', reason, ...details }, `🔒 [Auth Failure] ${reason}`);
  },

  invoiceEvent: (eventType: 'CREATED' | 'UPDATED' | 'PAYMENT_RECORDED' | 'CANCELLED', invoiceId: string, agencyId: string, details: LogContext = {}) => {
    logger.info({ event: 'INVOICE_EVENT', eventType, invoiceId, agencyId, ...details }, `💰 [Invoice ${eventType}] ID: ${invoiceId}`);
  }
};
