import { useState, useMemo } from 'react';
import type { ReactNode } from 'react';
import { SearchBar } from './SearchBar';

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  render?: (row: T) => ReactNode;
  align?: 'left' | 'center' | 'right';
  headerClassName?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  searchPlaceholder?: string;
  searchKeys?: string[];
  showSearch?: boolean;
  onRowClick?: (row: T) => void;
  compact?: boolean;
  stickyHeader?: boolean;
  className?: string;
  emptyMessage?: string;
}

function getNestedValue(obj: unknown, path: string): unknown {
  let current: unknown = obj;
  for (const key of path.split('.')) {
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

export function DataTable<T>({
  data,
  columns,
  rowKey,
  searchPlaceholder = 'Search...',
  searchKeys = [],
  showSearch = false,
  onRowClick,
  compact = false,
  stickyHeader = false,
  className = '',
  emptyMessage = 'No data',
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [search, setSearch] = useState('');

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const filtered = useMemo(() => {
    if (!search || searchKeys.length === 0) return data;
    const q = search.toLowerCase();
    return data.filter((row) =>
      searchKeys.some((key) => {
        const val = getNestedValue(row, key);
        return val != null && String(val).toLowerCase().includes(q);
      })
    );
  }, [data, search, searchKeys]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const slice = [...filtered];
    slice.sort((a, b) => {
      const aVal = getNestedValue(a, sortKey);
      const bVal = getNestedValue(b, sortKey);

      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }

      const aStr = String(aVal);
      const bStr = String(bVal);
      return sortDir === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    });
    return slice;
  }, [filtered, sortKey, sortDir]);

  const cellPadding = compact ? 'py-1 px-2' : 'py-2 px-3';
  const alignClass = (align?: 'left' | 'center' | 'right') =>
    align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';

  return (
    <div className={className}>
      {showSearch && (
        <div className="mb-3">
          <SearchBar
            placeholder={searchPlaceholder}
            value={search}
            onChange={setSearch}
          />
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr
              className={`
                bg-f1-surface border-b border-f1-border
                ${stickyHeader ? 'sticky top-0 z-10' : ''}
              `}
            >
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={col.width ? { width: col.width } : undefined}
                  className={`
                    ${cellPadding} text-f1-text-muted text-xs uppercase font-semibold
                    ${alignClass(col.align)}
                    ${col.sortable ? 'cursor-pointer select-none hover:text-f1-text' : ''}
                    ${col.headerClassName ?? ''}
                  `}
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {col.sortable && sortKey === col.key && (
                      <span className="text-f1-text text-[10px]">
                        {sortDir === 'asc' ? '\u2191' : '\u2193'}
                      </span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="text-center text-f1-text-muted text-sm py-8"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              sorted.map((row) => (
                <tr
                  key={rowKey(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={`
                    border-b border-f1-border/30
                    hover:bg-f1-elevated/30 transition-colors
                    ${onRowClick ? 'cursor-pointer' : ''}
                  `}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`${cellPadding} text-sm ${alignClass(col.align)}`}
                    >
                      {col.render
                        ? col.render(row)
                        : (
                            <span className="font-timing">
                              {String(getNestedValue(row, col.key) ?? '')}
                            </span>
                          )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
