import { useState, useMemo } from 'react';

export type SortDirection = 'asc' | 'desc';

export interface SortConfig<K extends string = string> {
  key: K;
  direction: SortDirection;
}

export function useSort<T, K extends string = string>(
  data: T[],
  defaultKey: K,
  defaultDirection: SortDirection = 'desc',
) {
  const [sortConfig, setSortConfig] = useState<SortConfig<K>>({
    key: defaultKey,
    direction: defaultDirection,
  });

  const sorted = useMemo(() => {
    const { key, direction } = sortConfig;
    return [...data].sort((a, b) => {
      const aVal = (a as Record<string, unknown>)[key];
      const bVal = (b as Record<string, unknown>)[key];

      // Handle strings
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return direction === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      // Handle numbers (and treat nullish as 0)
      const aNum = Number(aVal) || 0;
      const bNum = Number(bVal) || 0;
      return direction === 'asc' ? aNum - bNum : bNum - aNum;
    });
  }, [data, sortConfig]);

  const toggleSort = (key: K) => {
    setSortConfig(prev =>
      prev.key === key
        ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: 'desc' },
    );
  };

  return { sorted, sortConfig, toggleSort };
}
