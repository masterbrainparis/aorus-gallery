import { matchesArtworkStatuses, type ArtworkStatusFilter } from '@/lib/artwork-status';

export interface ArtworkAdminListItem {
  artistId: string;
  artist: { name: string };
  title: unknown;
  medium: unknown;
  dimensions: string | null;
  widthCm?: unknown;
  heightCm?: unknown;
  diameterCm?: unknown;
  depthCm?: unknown;
  price: unknown;
  sold: boolean;
  reserved: boolean;
  sortOrder: number;
}

export interface ArtworkAdminPageOptions {
  page?: number;
  pageSize?: number;
  artistId?: string;
  statuses?: ArtworkStatusFilter[];
  query?: string;
  sort?: 'title' | 'artist' | 'price';
  direction?: 'asc' | 'desc';
}

export function searchableArtworkText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (!value || typeof value !== 'object') return '';
  return Object.values(value as Record<string, unknown>)
    .filter((entry): entry is string => typeof entry === 'string')
    .join(' ');
}

export function prepareArtworkAdminPage<T extends ArtworkAdminListItem>(
  artworks: T[],
  options: ArtworkAdminPageOptions = {},
) {
  const pageSize = Math.max(1, options.pageSize ?? 20);
  const requestedPage = Math.max(1, options.page ?? 1);
  const statuses = options.statuses ?? [];
  const query = options.query?.trim().toLocaleLowerCase('fr') ?? '';

  const filtered = artworks.filter((artwork) => {
    if (options.artistId && artwork.artistId !== options.artistId) return false;
    if (!matchesArtworkStatuses(artwork, statuses)) return false;
    if (!query) return true;

    return [
      searchableArtworkText(artwork.title),
      searchableArtworkText(artwork.medium),
      artwork.artist.name,
      artwork.dimensions ?? '',
      artwork.widthCm,
      artwork.heightCm,
      artwork.diameterCm,
      artwork.depthCm,
    ].some((value) => String(value ?? '').toLocaleLowerCase('fr').includes(query));
  });

  const direction = options.direction === 'desc' ? -1 : 1;
  const sort = options.sort ?? 'artist';
  const sorted = [...filtered].sort((a, b) => {
    let comparison = 0;
    if (sort === 'price') comparison = Number(a.price ?? 0) - Number(b.price ?? 0);
    if (sort === 'artist') comparison = a.artist.name.localeCompare(b.artist.name, 'fr');
    if (sort === 'title') {
      comparison = searchableArtworkText(a.title).localeCompare(searchableArtworkText(b.title), 'fr');
    }
    if (comparison === 0) comparison = a.sortOrder - b.sortOrder;
    return comparison * direction;
  });

  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(requestedPage, totalPages);

  return {
    items: sorted.slice((page - 1) * pageSize, page * pageSize),
    total,
    page,
    pageSize,
    totalPages,
  };
}
