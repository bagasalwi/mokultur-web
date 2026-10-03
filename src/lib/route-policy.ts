export function isAnimePath(pathname: string): boolean {
  return pathname === '/anime' || pathname.startsWith('/anime/');
}
