import { env } from '@/env';

export const STORAGE_BUCKETS = {
  RESUMES: 'resumes',
  COMPLIANCE_DOCS: 'compliance-docs',
  OFFER_DOCUMENTS: 'offer-documents'
} as const;

export type StorageBucket = (typeof STORAGE_BUCKETS)[keyof typeof STORAGE_BUCKETS];

let bucketsEnsured = false;

/**
 * Ensures required storage buckets exist via REST API.
 */
export async function ensureStorageBucketsExist(): Promise<void> {
  if (bucketsEnsured) return;
  const baseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!baseUrl || !serviceKey) return;

  const buckets = Object.values(STORAGE_BUCKETS);

  for (const bucketName of buckets) {
    try {
      await fetch(`${baseUrl}/storage/v1/bucket`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceKey}`,
          'apikey': serviceKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: bucketName,
          name: bucketName,
          public: true,
          file_size_limit: 15728640
        })
      });
    } catch (err: any) {
      // Ignore if bucket exists or fetch fails
    }
  }
  bucketsEnsured = true;
}

export interface UploadFileOptions {
  bucket: StorageBucket;
  agencyId: string;
  entityId?: string | null;
  fileName: string;
  fileBuffer: Buffer | Blob | Uint8Array;
  contentType?: string;
}

export interface UploadFileResult {
  filePath: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  uploadedAt: Date;
}

/**
 * Uploads a file to Object Storage using pure HTTP REST API.
 */
export async function uploadToStorage(options: UploadFileOptions): Promise<UploadFileResult> {
  const { bucket, agencyId, entityId, fileName, fileBuffer, contentType = 'application/octet-stream' } = options;

  if (!agencyId) {
    throw new Error('[Storage Isolation] agencyId is required for tenant multi-tenant security');
  }

  await ensureStorageBucketsExist();

  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const timestamp = Date.now();
  const safeEntityId = entityId || 'general';
  const filePath = `${agencyId}/${safeEntityId}/${timestamp}_${sanitizedFileName}`;

  const baseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (baseUrl && serviceKey) {
    try {
      const res = await fetch(`${baseUrl}/storage/v1/object/${bucket}/${filePath}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceKey}`,
          'apikey': serviceKey,
          'Content-Type': contentType,
          'x-upsert': 'true'
        },
        body: fileBuffer as any
      });

      if (!res.ok) {
        console.warn(`[Storage REST] Upload returned status ${res.status}`);
      }
    } catch (err: any) {
      console.warn(`[Storage REST] Upload exception:`, err.message);
    }
  }

  const fileUrl = `${baseUrl}/storage/v1/object/public/${bucket}/${filePath}`;

  let fileSize = 0;
  if (fileBuffer instanceof Buffer) {
    fileSize = fileBuffer.length;
  } else if ('size' in fileBuffer && typeof (fileBuffer as any).size === 'number') {
    fileSize = (fileBuffer as any).size;
  } else if ('byteLength' in fileBuffer && typeof (fileBuffer as any).byteLength === 'number') {
    fileSize = (fileBuffer as any).byteLength;
  }

  return {
    filePath,
    fileUrl,
    fileName: sanitizedFileName,
    fileSize,
    uploadedAt: new Date()
  };
}

/**
 * Deletes a file from Storage enforcing tenant ownership verification.
 */
export async function deleteFromStorage(
  bucket: StorageBucket,
  agencyId: string,
  filePath: string
): Promise<boolean> {
  if (!filePath) return true;

  if (!filePath.startsWith(`${agencyId}/`)) {
    throw new Error(`[Tenant Isolation Violation] Path '${filePath}' does not belong to agency '${agencyId}'`);
  }

  const baseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (baseUrl && serviceKey) {
    try {
      await fetch(`${baseUrl}/storage/v1/object/${bucket}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${serviceKey}`,
          'apikey': serviceKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prefixes: [filePath] })
      });
    } catch (err: any) {
      console.error(`[Storage REST] Failed to delete file '${filePath}':`, err.message);
      return false;
    }
  }

  return true;
}
