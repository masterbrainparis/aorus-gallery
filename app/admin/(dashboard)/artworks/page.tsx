import { getAllArtworksAdmin } from '@/lib/queries/artworks';
import { db } from '@/lib/db-typed';
import { ArtworksListClient } from './client';
import { ARTWORK_STATUSES, type ArtworkStatusFilter } from '@/lib/artwork-status';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<{
    page?: string;
    artistId?: string;
    status?: string;
    q?: string;
    sort?: string;
    dir?: string;
  }>;
}

export default async function AdminArtworksPage({ searchParams }: Props) {
  const { page: pageStr, artistId, status, q, sort: rawSort, dir: rawDirection } = await searchParams;
  const page = Math.max(1, parseInt(pageStr || '1', 10));
  const statuses = (status?.split(',') ?? [])
    .filter((value): value is ArtworkStatusFilter => ARTWORK_STATUSES.includes(value as ArtworkStatusFilter));
  const sort = rawSort === 'title' || rawSort === 'price' ? rawSort : 'artist';
  const direction = rawDirection === 'desc' ? 'desc' : 'asc';

  const [result, artists] = await Promise.all([
    getAllArtworksAdmin({
      page,
      pageSize: 20,
      artistId: artistId || undefined,
      statuses,
      query: q,
      sort,
      direction,
    }),
    db.artist.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
  ]);

  // Build search params to preserve in pagination links
  const paginationSearchParams: Record<string, string> = {};
  if (artistId) paginationSearchParams.artistId = artistId;
  if (statuses.length) paginationSearchParams.status = statuses.join(',');
  if (q) paginationSearchParams.q = q;
  paginationSearchParams.sort = sort;
  paginationSearchParams.dir = direction;

  return (
    <ArtworksListClient
      artworks={result.items}
      artists={artists}
      currentArtistId={artistId || ''}
      currentStatuses={statuses}
      currentQuery={q || ''}
      currentSort={sort}
      currentDirection={direction}
      serverPagination={{
        totalPages: result.totalPages,
        currentPage: result.page,
        totalItems: result.total,
        basePath: '/admin/artworks',
        searchParams: paginationSearchParams,
      }}
    />
  );
}
