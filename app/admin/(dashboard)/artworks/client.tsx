'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { AdminTable } from '@/components/admin/admin-table';
import { resolveTranslation, type TranslatableField } from '@/lib/i18n-content';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { deleteArtwork, toggleArtworkField } from '@/lib/actions/artworks';
import { QuickToggle } from '@/components/admin/quick-toggle';
import { AlertTriangle, ChevronDown, Eye } from 'lucide-react';
import { formatArtworkDimensions, type ArtworkDimensionType } from '@/lib/artwork-dimensions';
import { isContradictoryArtworkStatus, type ArtworkStatusFilter } from '@/lib/artwork-status';

type Artist = { id: string; name: string };

type Artwork = {
  id: string;
  slug: string;
  title: unknown;
  imageUrl: string;
  dimensions: string | null;
  dimensionType: ArtworkDimensionType;
  widthCm: number | null;
  heightCm: number | null;
  diameterCm: number | null;
  depthCm: number | null;
  medium: unknown;
  price: number | null;
  currency: string | null;
  visible: boolean;
  featuredHome: boolean;
  showPrice: boolean;
  sold: boolean;
  reserved: boolean;
  artistId: string;
  artist: { name: string; slug: string };
};

interface ServerPaginationConfig {
  totalPages: number;
  currentPage: number;
  totalItems: number;
  basePath: string;
  searchParams?: Record<string, string>;
}

export function ArtworksListClient({
  artworks,
  artists,
  currentArtistId,
  currentStatuses,
  currentQuery,
  currentSort,
  currentDirection,
  serverPagination,
}: {
  artworks: Artwork[];
  artists: Artist[];
  currentArtistId: string;
  currentStatuses: ArtworkStatusFilter[];
  currentQuery: string;
  currentSort: 'title' | 'artist' | 'price';
  currentDirection: 'asc' | 'desc';
  serverPagination: ServerPaginationConfig;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();
  const t = useTranslations('admin');
  const [searchDraft, setSearchDraft] = useState({ base: currentQuery, value: currentQuery });
  const searchValue = searchDraft.base === currentQuery ? searchDraft.value : currentQuery;

  useEffect(() => {
    if (searchValue === currentQuery) return;
    const timeout = window.setTimeout(() => {
      const params = new URLSearchParams(searchParamsString);
      if (searchValue.trim()) params.set('q', searchValue.trim());
      else params.delete('q');
      params.set('page', '1');
      router.replace(`/admin/artworks?${params.toString()}`);
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [currentQuery, router, searchParamsString, searchValue]);

  const columns = [
    {
      key: 'title',
      label: t('artworks.columns.artwork'),
      sortable: true,
      getValue: (aw: Artwork) => resolveTranslation(aw.title as TranslatableField, 'fr'),
      render: (aw: Artwork) => {
        const title = resolveTranslation(aw.title as TranslatableField, 'fr');
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 rounded">
              <AvatarImage src={aw.imageUrl} alt={title} />
              <AvatarFallback className="rounded">{title.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-sm text-gray-900">{title}</p>
              <p className="text-gray-500 text-xs">
                {formatArtworkDimensions(aw, 'fr') ?? '—'}
              </p>
              {isContradictoryArtworkStatus(aw) && (
                <p className="mt-1 flex items-center gap-1 text-xs font-medium text-amber-700">
                  <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                  {t('artworks.inconsistentStatusShort')}
                </p>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: 'artist',
      label: t('artworks.columns.artist'),
      sortable: true,
      getValue: (aw: Artwork) => aw.artist.name,
      render: (aw: Artwork) => <span className="text-sm text-gray-900">{aw.artist.name}</span>,
    },
    {
      key: 'medium',
      label: t('artworks.columns.medium'),
      render: (aw: Artwork) => (
        <span className="text-sm text-gray-900">
          {aw.medium ? resolveTranslation(aw.medium as TranslatableField, 'fr') : '\u2014'}
        </span>
      ),
    },
    {
      key: 'price',
      label: t('artworks.columns.price'),
      sortable: true,
      getValue: (aw: Artwork) => aw.price ?? 0,
      render: (aw: Artwork) => (
        <span className="text-sm text-gray-900">
          {aw.price ? `${aw.price} ${aw.currency}` : '\u2014'}
        </span>
      ),
    },
    {
      key: 'visible',
      label: t('artworks.columns.status'),
      render: (aw: Artwork) => (
        <div className="flex flex-wrap gap-x-3 gap-y-2" aria-label={t('artworks.statusCommands')}>
          <QuickToggle id={aw.id} field="visible" checked={aw.visible} action={toggleArtworkField} label={t('artworks.toggles.visible')} />
          <QuickToggle id={aw.id} field="featuredHome" checked={aw.featuredHome} action={toggleArtworkField} label={t('artworks.toggles.featured')} />
          <QuickToggle id={aw.id} field="showPrice" checked={aw.showPrice} action={toggleArtworkField} label={t('artworks.toggles.price')} />
          <QuickToggle id={aw.id} field="sold" checked={aw.sold} action={toggleArtworkField} label={t('artworks.toggles.sold')} />
          <QuickToggle id={aw.id} field="reserved" checked={aw.reserved} action={toggleArtworkField} label={t('artworks.toggles.reserved')} />
        </div>
      ),
    },
  ];

  const updateParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
    params.set('page', '1');
    router.push(`/admin/artworks?${params.toString()}`);
  };

  const toggleStatusFilter = (status: ArtworkStatusFilter) => {
    const next = currentStatuses.includes(status)
      ? currentStatuses.filter((value) => value !== status)
      : [...currentStatuses, status];
    updateParams({ status: next.length ? next.join(',') : null });
  };

  return (
    <div>
      <fieldset className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
        <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-gray-500">
          {t('artworks.filters.title')}
        </legend>
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative">
          <select
            value={currentArtistId}
            onChange={(event) => updateParams({ artistId: event.target.value || null })}
            aria-label={t('artworks.filters.artist')}
            className="w-56 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 appearance-none pr-10 cursor-pointer focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500 transition-colors"
          >
            <option value="">{t('artworks.allArtists')}</option>
            {artists.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {(['available', 'reserved', 'sold'] as const).map((status) => (
              <label key={status} className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={currentStatuses.includes(status)}
                  onChange={() => toggleStatusFilter(status)}
                  className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500"
                />
                {t(`artworks.filters.${status}`)}
              </label>
            ))}
          </div>
        </div>
        <p className="mt-3 text-xs text-gray-500">{t('artworks.filters.help')}</p>
      </fieldset>
      <AdminTable
        title={t('artworks.title')}
        data={artworks}
        columns={columns}
        searchKeys={['title', 'artist']}
        searchPlaceholder={t('artworks.searchPlaceholder')}
        newHref="/admin/artworks/new"
        newLabel={t('artworks.newArtwork')}
        editHref={(aw) => `/admin/artworks/${aw.id}`}
        deleteAction={deleteArtwork}
        getId={(aw) => aw.id}
        serverPagination={serverPagination}
        serverSearch={{
          value: searchValue,
          onChange: (value) => setSearchDraft({ base: currentQuery, value }),
        }}
        serverSort={{
          key: currentSort,
          direction: currentDirection,
          onChange: (key, direction) => {
            if (key !== 'title' && key !== 'artist' && key !== 'price') return;
            updateParams({ sort: key, dir: direction });
          },
        }}
        extraActions={(aw) => (
          <a
            href={`/fr/artworks/${aw.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center h-8 w-8 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            title={t('table.viewPublicPage')}
            data-testid="view-btn"
          >
            <Eye className="h-4 w-4" />
          </a>
        )}
      />
    </div>
  );
}
