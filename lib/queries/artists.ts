import { db } from '@/lib/db-typed';
import { resolveTranslation } from '@/lib/i18n-content';
import { serializePrismaPage } from '@/lib/queries/serialize';
import type { Locale } from '@/i18n/routing';
import { formatArtworkDimensions } from '@/lib/artwork-dimensions';

/** Format CV entries with year prefix, sorted by year descending */
function formatCVEntries(
  entries: { title: unknown; year: number | null }[],
  locale: Locale,
): string[] {
  const sorted = [...entries].sort((a, b) => {
    if (a.year && b.year) return b.year - a.year;
    if (a.year) return -1;
    if (b.year) return 1;
    return 0;
  });
  return sorted.map((e) => {
    const title = resolveTranslation(e.title as Parameters<typeof resolveTranslation>[0], locale);
    return e.year ? `${e.year} — ${title}` : title;
  });
}

export async function getArtists() {
  return db.artist.findMany({
    where: { visible: true },
    orderBy: { sortOrder: 'asc' },
    include: {
      exhibitions: { orderBy: [{ year: 'desc' }, { sortOrder: 'asc' }] },
      collections: { orderBy: { sortOrder: 'asc' } },
    },
  });
}

export async function getArtistBySlug(slug: string) {
  return db.artist.findUnique({
    where: { slug },
    include: {
      exhibitions: { orderBy: [{ year: 'desc' }, { sortOrder: 'asc' }] },
      collections: { orderBy: { sortOrder: 'asc' } },
      artworks: { where: { visible: true }, orderBy: { sortOrder: 'asc' } },
    },
  });
}

export async function getAllArtistSlugs() {
  const artists = await db.artist.findMany({
    where: { visible: true },
    select: { slug: true },
  });
  return artists.map((a) => a.slug);
}

/** Returns lightweight data for artist list/grid pages (no CV, no bio, no joins) */
export async function getArtistsListForFrontend(locale: Locale = 'en') {
  const artists = await db.artist.findMany({
    where: { visible: true },
    orderBy: { sortOrder: 'asc' },
    select: { slug: true, name: true, nationality: true, imageUrl: true, imageWidth: true, imageHeight: true },
  });
  return artists.map((a) => ({
    id: a.slug,
    name: a.name,
    nationality: resolveTranslation(a.nationality, locale),
    image: a.imageUrl,
    imageWidth: a.imageWidth,
    imageHeight: a.imageHeight,
  }));
}

/** Returns data for the frontend with CV grouped by type */
export async function getArtistsForFrontend(locale: Locale = 'en') {
  const artists = await getArtists();
  return artists.map((a) => ({
    id: a.slug,
    name: a.name,
    nationality: resolveTranslation(a.nationality, locale),
    bio: resolveTranslation(a.bio, locale),
    image: a.imageUrl,
    cv: {
      soloShows: formatCVEntries(a.exhibitions.filter((e) => e.type === 'SOLO_SHOW'), locale),
      groupShows: formatCVEntries(a.exhibitions.filter((e) => e.type === 'GROUP_SHOW'), locale),
      artFairs: formatCVEntries(a.exhibitions.filter((e) => e.type === 'ART_FAIR'), locale),
      residencies: formatCVEntries(a.exhibitions.filter((e) => e.type === 'RESIDENCY'), locale),
      awards: formatCVEntries(a.exhibitions.filter((e) => e.type === 'AWARD'), locale),
      collections: a.collections.map((c) => resolveTranslation(c.title, locale)),
    },
  }));
}

/** Returns a single artist in the frontend shape with CV grouped by type */
export async function getArtistBySlugForFrontend(slug: string, locale: Locale = 'en') {
  const a = await getArtistBySlug(slug);
  if (!a) return null;
  return {
    id: a.slug,
    name: a.name,
    nationality: resolveTranslation(a.nationality, locale),
    bio: resolveTranslation(a.bio, locale),
    image: a.imageUrl,
    cv: {
      soloShows: formatCVEntries(a.exhibitions.filter((e) => e.type === 'SOLO_SHOW'), locale),
      groupShows: formatCVEntries(a.exhibitions.filter((e) => e.type === 'GROUP_SHOW'), locale),
      artFairs: formatCVEntries(a.exhibitions.filter((e) => e.type === 'ART_FAIR'), locale),
      residencies: formatCVEntries(a.exhibitions.filter((e) => e.type === 'RESIDENCY'), locale),
      awards: formatCVEntries(a.exhibitions.filter((e) => e.type === 'AWARD'), locale),
      collections: a.collections.map((c) => resolveTranslation(c.title, locale)),
    },
    // Whitelist explicite — exclut `internalNote` et `countries` (champs
     // admin only, jamais exposés au client public).
    artworks: a.artworks.map((aw) => ({
      id: aw.id,
      slug: aw.slug,
      title: resolveTranslation(aw.title, locale),
      medium: aw.medium ? resolveTranslation(aw.medium, locale) : null,
      dimensions: aw.dimensions,
      formattedDimensions: formatArtworkDimensions({
        ...aw,
        widthCm: aw.widthCm ? Number(aw.widthCm) : null,
        heightCm: aw.heightCm ? Number(aw.heightCm) : null,
        diameterCm: aw.diameterCm ? Number(aw.diameterCm) : null,
        depthCm: aw.depthCm ? Number(aw.depthCm) : null,
      }, locale),
      widthCm: aw.widthCm ? Number(aw.widthCm) : null,
      heightCm: aw.heightCm ? Number(aw.heightCm) : null,
      year: aw.year,
      showPrice: aw.showPrice,
      price: aw.price ? Number(aw.price) : null,
      currency: aw.currency,
      sold: aw.sold,
      imageUrl: aw.imageUrl,
      imageWidth: aw.imageWidth,
      imageHeight: aw.imageHeight,
      images: aw.images,
      sortOrder: aw.sortOrder,
    })),
  };
}

/** Paginated result shape for admin list pages */
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** Get all artists including hidden ones (for admin) — with server-side pagination */
export async function getAllArtistsAdmin(
  page: number = 1,
  pageSize: number = 20,
) {
  const [artists, total] = await Promise.all([
    db.artist.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: { select: { artworks: true } },
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.artist.count(),
  ]);

  return serializePrismaPage({
    items: artists,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}
