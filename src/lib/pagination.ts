export function pageNumber(value: string | null): number | null {
  if (value === null) return 1;
  if (!/^\d+$/.test(value)) return null;
  const page = Number(value);
  return Number.isSafeInteger(page) && page > 0 ? page : null;
}

export function paginationPath(pathname: string, page: number): string {
  return page > 1 ? `${pathname}?page=${page}` : pathname;
}

export function paginationTotal(meta: { total: number; perPage: number }): number {
  return Math.max(1, Math.ceil(meta.total / meta.perPage));
}
