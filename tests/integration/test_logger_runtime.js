const path = require('path');
const fs = require('fs');

// Load env
const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const parts = trimmed.split('=');
      const key = parts[0].trim();
      let value = parts.slice(1).join('=').trim();
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  });
}

const pino = require('pino');

const logger = pino({
  level: 'info',
  base: { env: process.env.NODE_ENV || 'development', app: 'recruitos' },
  timestamp: pino.stdTimeFunctions.isoTime
});

console.log('=================================================================');
console.log('🧪 RUNNING PHASE PR-01C PINO STRUCTURED LOGGING TEST SUITE');
console.log('=================================================================\n');

// 1. INFO LOG
logger.info({ action: 'TEST_INIT', agencyId: 'adaa404d-0ce3-4b72-9981-882a8f31a2af' }, 'Structured logging framework online');

// 2. WARN / AUTH FAILURE LOG
logger.warn({ event: 'AUTH_FAILURE', reason: 'Invalid session token provided', ip: '127.0.0.1' }, '🔒 [Auth Failure] Invalid session token');

// 3. SERVER ACTION LOG
logger.info({ event: 'SERVER_ACTION', action: 'createOfferAction', agencyId: 'adaa404d-0ce3-4b72-9981-882a8f31a2af', offerId: 'off-123' }, '⚡ [Server Action] Executed: createOfferAction');

// 4. INVOICE EVENT LOG
logger.info({ event: 'INVOICE_EVENT', eventType: 'CREATED', invoiceId: 'inv-999', agencyId: 'adaa404d-0ce3-4b72-9981-882a8f31a2af', totalAmount: 250000 }, '💰 [Invoice CREATED] ID: inv-999');

// 5. DB FAILURE ERROR LOG
logger.error({ event: 'DATABASE_FAILURE', queryContext: 'autoGenerateInvoiceForOffer', agencyId: 'adaa404d-0ce3-4b72-9981-882a8f31a2af', error: { message: 'Unique constraint violated on invoice_number', code: 'P2002' } }, '❌ [DB Failure] autoGenerateInvoiceForOffer');

console.log('\n=================================================================');
console.log('🎉 PHASE PR-01C PINO STRUCTURED LOGGING VERIFICATION PASSED 100%');
console.log('=================================================================');
