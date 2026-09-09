/**
 * Recursively converts Prisma Decimal fields (and any objects with .toNumber() or Decimal instances)
 * to plain JavaScript numbers (or null/undefined) so that plain objects are safely passed
 * from React Server Components to Client Components without Next.js serialization warnings.
 */
export function serializeDecimals<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }

  // Convert Prisma Decimal objects (which have a .toNumber() method)
  if (typeof data === 'object' && typeof (data as any).toNumber === 'function') {
    return (data as any).toNumber();
  }

  // Preserve Date objects
  if (data instanceof Date) {
    return data;
  }

  // Recursively process Arrays
  if (Array.isArray(data)) {
    return data.map(serializeDecimals) as any;
  }

  // Recursively process plain JS objects / Prisma record objects
  if (typeof data === 'object' && data.constructor === Object) {
    const result: any = {};
    for (const [key, value] of Object.entries(data)) {
      result[key] = serializeDecimals(value);
    }
    return result;
  }

  // Also handle objects where constructor may be Prisma model or custom prototype
  if (typeof data === 'object') {
    const result: any = {};
    for (const key of Object.keys(data)) {
      result[key] = serializeDecimals((data as any)[key]);
    }
    return result;
  }

  return data;
}
