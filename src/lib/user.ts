import { PUBLIC_API_URL } from '$env/static/public';

/**
 * Avatar paths arrive in three shapes because the accounts predate the split
 * between the Laravel admin and this site: absolute URLs, API upload paths, and
 * legacy Laravel storage paths.
 *
 * Lifted out of Navbar.svelte so the dashboard does not carry a second copy
 * that can drift from it.
 */
export function avatarUrl(img: string | null | undefined): string | null {
  if (!img) return null;
  if (img.startsWith('http://') || img.startsWith('https://')) return img;
  if (img.startsWith('/uploads/')) return `${PUBLIC_API_URL}${img}`;
  // legacy Laravel storage path (e.g. "storage/profile/xxx.jpg")
  if (img.startsWith('storage/') || img.startsWith('/storage/')) {
    const p = img.startsWith('/') ? img : `/${img}`;
    return `https://mokultur.com${p}`;
  }
  return img;
}

/** Fallback monogram for accounts with no avatar. */
export function initials(name: string): string {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('') || '?'
  );
}

/** Indonesian label for an RBAC role name, for display only. */
export function roleLabel(roleName: string | null | undefined): string {
  switch (roleName) {
    case 'super_admin':
    case 'admin':
      return 'Admin';
    case 'editor':
      return 'Editor';
    case 'contributor':
      return 'Kontributor';
    default:
      return 'Pembaca';
  }
}
