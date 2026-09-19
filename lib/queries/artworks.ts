import { db } from '@/lib/db-typed';
import { resolveTranslation } from '@/lib/i18n-content';
import { serializePrismaPage } from '@/lib/queries/serialize';
import type { Locale } from '@/i18n/routing';
import { ARTWORK_STATUSES, type ArtworkStatusFilter } from '@/lib/artwork-status';
import { formatArtworkDimensions } from '@/lib/artwork-dimensions';
import { prepareArtworkAdminPage } from '@/lib/artwork-admin-list';

export async function getFeaturedArtworks(locale: Locale = 'en') {
  const artworks = await db.artwork.findMany({
    where: { featuredHome: true, visible: true },
    orderBy: { sortOrder: 'asc' },
    take: 10,
    include: { artist: { select: { name: true, slug: true } } },
  });
  return artworks.map((aw) => ({
    id: aw.id,
    slug: aw.slug,
    title: resolveTranslation(aw.title, locale),
    imageUrl: aw.imageUrl,
    imageWidth: aw.imageWidth,
    imageHeight: aw.imageHeight,
    artistName: aw.artist.name,
    artistSlug: aw.artist.slug,
  }));
}

export async function getArtworksByArtist(artistId: string) {
  return db.artwork.findMany({
    where: { artistId, visible: true },
    orderBy: { sortOrder: 'asc' },
  });
}

/** Paginated result shape for admin list pages */
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** Get all artworks for admin with artist name — serializes Decimal to number */
export interface ArtworkAdminListOptions {
  page?: number;
  pageSize?: number;
  artistId?: string;
  statuses?: ArtworkStatusFilter[];
  query?: string;
  sort?: 'title' | 'artist' | 'price';
  direction?: 'asc' | 'desc';
}

export async function getAllArtworksAdmin(options: ArtworkAdminListOptions = {}) {
  const statuses = (options.statuses ?? []).filter((status) => ARTWORK_STATUSES.includes(status));

  const artworks = await db.artwork.findMany({
    orderBy: [{ artist: { name: 'asc' } }, { sortOrder: 'asc' }],
    include: {
      artist: { select: { name: true, slug: true } },
    },
  });

  const prepared = prepareArtworkAdminPage(artworks, { ...options, statuses });

  // serializePrismaPage handles Decimal → number coercion + strips the
  // nodejs.util.inspect.custom symbol that Prisma 7 attaches to model instances.
  // The runtime shape has price as number; cast the type explicitly since TS
  // can't infer through the recursive cleaner.
  type AdminArtworkRow = Omit<
    (typeof artworks)[number],
    'price' | 'widthCm' | 'heightCm' | 'diameterCm' | 'depthCm'
  > & {
    price: number | null;
    widthCm: number | null;
    heightCm: number | null;
    diameterCm: number | null;
    depthCm: number | null;
  };
  const page_ = serializePrismaPage({
    ...prepared,
    items: prepared.items.map((artwork) => ({
      ...artwork,
      price: artwork.price == null ? null : Number(artwork.price),
      widthCm: artwork.widthCm == null ? null : Number(artwork.widthCm),
      heightCm: artwork.heightCm == null ? null : Number(artwork.heightCm),
      diameterCm: artwork.diameterCm == null ? null : Number(artwork.diameterCm),
      depthCm: artwork.depthCm == null ? null : Number(artwork.depthCm),
    })),
  });
  return { ...page_, items: page_.items as unknown as AdminArtworkRow[] };
}

export async function getArtworkById(id: string) {
  return db.artwork.findUnique({
    where: { id },
    include: { artist: { select: { name: true, slug: true } } },
  });
}

/** Returns a single artwork by slug with artist info and adjacent artworks for navigation */
export async function getArtworkBySlugForFrontend(slug: string, locale: Locale = 'en') {
  const artwork = await db.artwork.findUnique({
    where: { slug, visible: true },
    include: {
      artist: {
        select: { name: true, slug: true, id: true },
      },
    },
  });

  if (!artwork) return null;

  // Fetch adjacent artworks (prev/next by sortOrder within same artist)
  const [prevArtwork, nextArtwork] = await Promise.all([
    db.artwork.findFirst({
      where: {
        artistId: artwork.artistId,
        visible: true,
        sortOrder: { lt: artwork.sortOrder },
      },
      orderBy: { sortOrder: 'desc' },
      select: { slug: true, title: true },
    }),
    db.artwork.findFirst({
      where: {
        artistId: artwork.artistId,
        visible: true,
        sortOrder: { gt: artwork.sortOrder },
      },
      orderBy: { sortOrder: 'asc' },
      select: { slug: true, title: true },
    }),
  ]);

  const imagesMeta = Array.isArray(artwork.imagesMeta)
    ? (artwork.imagesMeta as Array<{ width: number | null; height: number | null }>)
    : [];

  return {
    id: artwork.id,
    slug: artwork.slug,
    title: resolveTranslation(artwork.title, locale),
    medium: artwork.medium ? resolveTranslation(artwork.medium, locale) : null,
    dimensions: artwork.dimensions,
    dimensionType: artwork.dimensionType,
    widthCm: artwork.widthCm ? Number(artwork.widthCm) : null,
    heightCm: artwork.heightCm ? Number(artwork.heightCm) : null,
    diameterCm: artwork.diameterCm ? Number(artwork.diameterCm) : null,
    depthCm: artwork.depthCm ? Number(artwork.depthCm) : null,
    formattedDimensions: formatArtworkDimensions({
      ...artwork,
      widthCm: artwork.widthCm ? Number(artwork.widthCm) : null,
      heightCm: artwork.heightCm ? Number(artwork.heightCm) : null,
      diameterCm: artwork.diameterCm ? Number(artwork.diameterCm) : null,
      depthCm: artwork.depthCm ? Number(artwork.depthCm) : null,
    }, locale),
    year: artwork.year,
    price: artwork.showPrice && artwork.price ? Number(artwork.price) : null,
    currency: artwork.currency,
    showPrice: artwork.showPrice,
    sold: artwork.sold,
    imageUrl: artwork.imageUrl,
    imageWidth: artwork.imageWidth,
    imageHeight: artwork.imageHeight,
    images: artwork.images,
    imagesMeta: imagesMeta.map((m, i) => ({
      width: m?.width ?? null,
      height: m?.height ?? null,
      index: i,
    })),
    artist: {
      id: artwork.artist.id,
      name: artwork.artist.name,
      slug: artwork.artist.slug,
    },
    prevArtwork: prevArtwork
      ? { slug: prevArtwork.slug, title: resolveTranslation(prevArtwork.title, locale) }
      : null,
    nextArtwork: nextArtwork
      ? { slug: nextArtwork.slug, title: resolveTranslation(nextArtwork.title, locale) }
      : null,
  };
}
