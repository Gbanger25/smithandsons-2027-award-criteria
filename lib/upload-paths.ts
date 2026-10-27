/**
 * Client-safe helpers shared by the browser uploader, the blob-upload token
 * route and the submit Server Actions, so all three agree on where photos live.
 */

export const MAX_UPLOAD_FILES = 15
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024
export const ALLOWED_UPLOAD_TYPES = ["image/jpeg", "image/png", "image/gif"]

export type UploadKind = "entries" | "applications"

/**
 * Offices are picked from a fixed list, but normalising guards against a
 * stray case or spacing difference creating a second ballot for one office.
 */
export function officeKey(office: string): string {
  return office.trim().toLowerCase().replace(/\s+/g, "-")
}

/**
 * A single URL-safe path segment for an office. Kept separate from officeKey()
 * because officeKey() values are stored in DynamoDB and must not change.
 */
export function officeFolder(office: string): string {
  return officeKey(office)
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function uploadFolder(kind: UploadKind, slug: string, office: string) {
  return `${kind}/${slug}/${officeFolder(office)}/`
}

/** Keeps blob pathnames to one safe segment regardless of the original name. */
export function safeFileName(name: string): string {
  const cleaned = name
    .replace(/[/\\?#%]+/g, "-")
    .replace(/\s+/g, " ")
    .trim()
  return cleaned.length > 0 ? cleaned.slice(-120) : "photo"
}
