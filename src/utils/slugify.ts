export function slugify(displayName: string): string {
  return displayName
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

export function isValidSlug(slug: string): boolean {
  return /^[a-zA-Z0-9_]+$/.test(slug);
}
