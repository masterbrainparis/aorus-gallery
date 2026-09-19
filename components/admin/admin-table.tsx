'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AdminSearchInput } from './admin-search';
import { AdminBreadcrumb } from './admin-breadcrumb';
import { DeleteButton } from './delete-button';
import { TablePagination } from './table-pagination';
import { Plus, Pencil, ArrowUpDown } from 'lucide-react';

interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render: (item: T) => React.ReactNode;
  getValue?: (item: T) => string | number;
}

interface ServerPaginationConfig {
  totalPages: number;
  currentPage: number;
  totalItems: number;
  basePath: string;
  /** Extra search params to preserve in pagination links (e.g. artistId filter) */
  searchParams?: Record<string, string>;
}

interface AdminTableProps<T> {
  title: string;
  data: T[];
  columns: Column<T>[];
  searchKeys: string[];
  searchPlaceholder?: string;
  newHref?: string;
  newLabel?: string;
  editHref: (item: T) => string;
  deleteAction?: (id: string) => Promise<void | { error: string }>;
  getId: (item: T) => string;
  extraActions?: (item: T) => React.ReactNode;
  itemsPerPage?: number;
  /** When provided, pagination is handled server-side via URL params */
  serverPagination?: ServerPaginationConfig;
  serverSearch?: {
    value: string;
    onChange: (value: string) => void;
  };
  serverSort?: {
    key: string;
    direction: SortDir;
    onChange: (key: string, direction: SortDir) => void;
  };
}

type SortDir = 'asc' | 'desc';

export function AdminTable<T extends Record<string, unknown>>({
  title,
  data,
  columns,
  searchKeys,
  searchPlaceholder,
  newHref,
  newLabel,
  editHref,
  deleteAction,
  getId,
  extraActions,
  itemsPerPage = 10,
  serverPagination,
  serverSearch,
  serverSort,
}: AdminTableProps<T>) {
  const t = useTranslations('admin.table');
  const searchParams = useSearchParams();
  const createdId = searchParams.get('created');
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [clientPage, setClientPage] = useState(1);

  // Reset to page 1 whenever the search query changes (render-time state reset).
  const [prevQuery, setPrevQuery] = useState(query);
  if (prevQuery !== query) {
    setPrevQuery(query);
    setClientPage(1);
  }

  const queryValue = serverSearch?.value ?? query;
  const activeSortKey = serverSort?.key ?? sortKey;
  const activeSortDir = serverSort?.direction ?? sortDir;
  const externallyControlled = Boolean(serverSearch || serverSort);

  const filtered = useMemo(() => {
    if (externallyControlled) return data;
    if (!query.trim()) return data;
    const lower = query.toLowerCase();
    return data.filter((item) =>
      searchKeys.some((key) => {
        const val = item[key];
        if (typeof val === 'string') return val.toLowerCase().includes(lower);
        if (val && typeof val === 'object' && 'en' in (val as Record<string, unknown>)) {
          const t = val as Record<string, string>;
          return Object.values(t).some((v) => v?.toLowerCase().includes(lower));
        }
        if (val && typeof val === 'object' && 'name' in (val as Record<string, unknown>)) {
          const name = (val as Record<string, string>).name;
          return name?.toLowerCase().includes(lower);
        }
        return false;
      })
    );
  }, [data, externallyControlled, searchKeys, query]);

  const sorted = useMemo(() => {
    if (externallyControlled || !sortKey) return filtered;
    const col = columns.find((c) => c.key === sortKey);
    if (!col?.getValue) return filtered;
    const getValue = col.getValue;
    return [...filtered].sort((a, b) => {
      const aVal = getValue(a);
      const bVal = getValue(b);
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }
      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      return sortDir === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    });
  }, [filtered, sortKey, sortDir, columns, externallyControlled]);

  // In server-side mode, data is already paginated — display all items passed in
  // In client-side mode, paginate locally
  const isServerSide = !!serverPagination;
  const totalPages = isServerSide
    ? serverPagination.totalPages
    : Math.max(1, Math.ceil(sorted.length / itemsPerPage));
  const currentPage = isServerSide ? serverPagination.currentPage : clientPage;
  const displayItems = isServerSide
    ? sorted
    : sorted.slice((clientPage - 1) * itemsPerPage, clientPage * itemsPerPage);
  const totalItems = isServerSide ? serverPagination.totalItems : sorted.length;

  const handleSort = (key: string) => {
    if (serverSort) {
      serverSort.onChange(
        key,
        serverSort.key === key && serverSort.direction === 'asc' ? 'desc' : 'asc',
      );
      return;
    }
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const totalColumns = columns.length + 1;

  return (
    <div className="space-y-6">
      <AdminBreadcrumb items={[{ label: title }]} />

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">{title}</h1>
        {newHref && (
          <Link
            href={newHref}
            data-testid="new-btn"
            className="inline-flex items-center gap-1 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            {newLabel}
          </Link>
        )}
      </div>

      <AdminSearchInput
        value={queryValue}
        onChange={serverSearch?.onChange ?? setQuery}
        placeholder={searchPlaceholder ?? t('search')}
      />

      <div className="rounded-lg border border-gray-200 bg-white overflow-x-auto -mx-4 sm:mx-0">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col.key} className="text-gray-500 font-medium text-xs uppercase bg-gray-50">
                  {col.sortable ? (
                    <button
                      type="button"
                      className="flex items-center gap-1 text-gray-500 hover:text-gray-900"
                      onClick={() => handleSort(col.key)}
                      aria-pressed={activeSortKey === col.key}
                    >
                      {col.label}
                      <ArrowUpDown
                        className={`h-3.5 w-3.5 ${activeSortKey === col.key && activeSortDir === 'desc' ? 'rotate-180' : ''}`}
                      />
                    </button>
                  ) : (
                    col.label
                  )}
                </TableHead>
              ))}
              <TableHead className="text-right text-gray-500 font-medium text-xs uppercase bg-gray-50">{t('actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayItems.map((item) => {
              const isJustCreated = createdId === getId(item);
              return (
              <TableRow
                key={getId(item)}
                data-testid="table-row"
                data-just-created={isJustCreated ? 'true' : undefined}
                className={isJustCreated ? 'animate-just-created' : undefined}
              >
                {columns.map((col) => (
                  <TableCell key={col.key} className="text-gray-900 text-sm">{col.render(item)}</TableCell>
                ))}
                <TableCell className="text-right text-sm">
                  <div className="flex items-center justify-end gap-1">
                    {extraActions && extraActions(item)}
                    <a
                      href={editHref(item)}
                      className="inline-flex items-center justify-center h-8 w-8 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                      title={t('edit')}
                      data-testid="edit-btn"
                    >
                      <Pencil className="h-4 w-4" />
                    </a>
                    {deleteAction && (
                      <DeleteButton
                        id={getId(item)}
                        action={deleteAction}
                      />
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
            })}
            {displayItems.length === 0 && (
              <TableRow>
                <TableCell colSpan={totalColumns} className="h-24 text-center text-gray-500">
                  {t('noItems')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {isServerSide ? (
        <TablePagination
          serverSide
          totalItems={totalItems}
          totalPages={totalPages}
          currentPage={currentPage}
          basePath={serverPagination.basePath}
          searchParams={serverPagination.searchParams}
        />
      ) : (
        <TablePagination
          totalItems={totalItems}
          totalPages={totalPages}
          currentPage={currentPage}
          onPageChange={setClientPage}
        />
      )}
    </div>
  );
}
