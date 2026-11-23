import { useMemo, useState } from 'react';

export type SortDir = 'asc' | 'desc';

/**
 * Shared search / sort / pagination state for list pages.
 * `accessors` maps a sort key to a comparable value on the row.
 */
export function useTableControls<T extends { id: string }>(
  rows: T[],
  options: {
    searchKeys?: (row: T) => string;
    accessors: Record<string, (row: T) => string | number>;
    initialPageSize?: number;
    initialSort?: { key: string; dir: SortDir };
  }
) {
  const { searchKeys, accessors, initialPageSize = 8, initialSort } = options;
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [sort, setSort] = useState<{ key: string; dir: SortDir } | null>(initialSort || null);

  const searched = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || !searchKeys) return rows;
    return rows.filter((r) => searchKeys(r).toLowerCase().includes(q));
  }, [rows, query, searchKeys]);

  const sorted = useMemo(() => {
    if (!sort || !accessors[sort.key]) return searched;
    const get = accessors[sort.key];
    return [...searched].sort((a, b) => {
      const av = get(a);
      const bv = get(b);
      if (typeof av === 'number' && typeof bv === 'number') return sort.dir === 'asc' ? av - bv : bv - av;
      return sort.dir === 'asc'
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
  }, [searched, sort, accessors]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = useMemo(
    () => sorted.slice((safePage - 1) * pageSize, safePage * pageSize),
    [sorted, safePage, pageSize]
  );

  const onSort = (key: string) => {
    setSort((prev) =>
      prev?.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }
    );
    setPage(1);
  };

  return {
    query,
    setQuery: (v: string) => {
      setQuery(v);
      setPage(1);
    },
    page: safePage,
    setPage,
    pageSize,
    setPageSize,
    sort,
    onSort,
    paged,
    sorted,
    total: sorted.length,
  };
}

/** Debounce-free "loading" flash for filter changes — keeps charts from feeling static. */
export function useFlash(deps: unknown[], ms = 320) {
  const [loading, setLoading] = useState(false);
  const key = JSON.stringify(deps);
  const [lastKey, setLastKey] = useState(key);
  if (key !== lastKey) {
    setLastKey(key);
    if (!loading) {
      setLoading(true);
      setTimeout(() => setLoading(false), ms);
    }
  }
  return loading;
}
