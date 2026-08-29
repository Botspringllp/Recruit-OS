import { createClient } from '@supabase/supabase-js';
import { env } from '@/env';

// Administrative Supabase client using Service Role Key for server-side storage operations
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

export const STORAGE_BUCKETS = {
  RESUMES: 'resumes',
  COMPLIANCE_DOCS: 'compliance-docs',
  OFFER_DOCUMENTS: 'offer-documents'
} as const;

export type StorageBucket = (typeof STORAGE_BUCKETS)[keyof typeof STORAGE_BUCKETS];

/**
 * Ensures required storage buckets exist in Supabase.
 */
export async function ensureStorageBucketsExist(): Promise<void> {
  const buckets = Object.values(STORAGE_BUCKETS);

  for (const bucketName of buckets) {
    try {
      const { data: existing } = await supabaseAdmin.storage.getBucket(bucketName);
      if (!existing) {
        await supabaseAdmin.storage.createBucket(bucketName, {
          public: true,
          fileSizeLimit: 15728640 // 15 MB limit
        });
      }
    } catch (err: any) {
      // Ignore if bucket already exists
    }
  }
}

export interface UploadFileOptions {
  bucket: StorageBucket;
  agencyId: string;
  entityId?: string | null; // Candidate ID or Submission ID
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
 * Uploads a file to Supabase Storage enforcing tenant agencyId isolation pathing:
 * `{bucket}/{agencyId}/{entityId}/{timestamp}_{fileName}`
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

  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(filePath, fileBuffer, {
      contentType,
      upsert: true
    });

  if (error) {
    throw new Error(`[Storage] Upload to '${bucket}' failed: ${error.message}`);
  }

  const { data: urlData } = supabaseAdmin.storage.from(bucket).getPublicUrl(filePath);

  let fileSize = 0;
  if (fileBuffer instanceof Buffer) {
    fileSize = fileBuffer.length;
  } else if ('size' in fileBuffer && typeof (fileBuffer as any).size === 'number') {
    fileSize = (fileBuffer as any).size;
  } else if ('byteLength' in fileBuffer && typeof (fileBuffer as any).byteLength === 'number') {
    fileSize = (fileBuffer as any).byteLength;
  }

  return {
    filePath: data?.path || filePath,
    fileUrl: urlData.publicUrl,
    fileName: sanitizedFileName,
    fileSize,
    uploadedAt: new Date()
  };
}

/**
 * Deletes a file from Supabase Storage enforcing tenant ownership verification.
 */
export async function deleteFromStorage(
  bucket: StorageBucket,
  agencyId: string,
  filePath: string
): Promise<boolean> {
  if (!filePath) return true;

  // Enforce tenant scoping check
  if (!filePath.startsWith(`${agencyId}/`)) {
    throw new Error(`[Tenant Isolation Violation] Path '${filePath}' does not belong to agency '${agencyId}'`);
  }

  const { error } = await supabaseAdmin.storage.from(bucket).remove([filePath]);
  if (error) {
    console.error(`[Storage] Failed to delete file '${filePath}' from bucket '${bucket}':`, error.message);
    return false;
  }

  return true;
}
