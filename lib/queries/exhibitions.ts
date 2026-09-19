import { db } from '@/lib/db-typed';
import { resolveTranslation } from '@/lib/i18n-content';
import { serializePrismaRow } from '@/lib/queries/serialize';
import type { Locale } from '@/i18n/routing';
import { formatArtworkDimensions } from '@/lib/artwork-dimensions';

export async function getGalleryExhibitions(locale: Locale = 'en') {
  const exhibitions = await db.galleryExhibition.findMany({
    where: { visible: true },
    orderBy: [{ sortOrder: 'asc' }, { startDate: 'desc' }],
    include: {
      artists: { include: { artist: { select: { name: true, slug: true } } } },
    },
  });
  return exhibitions.map((ex) => ({
    id: ex.id,
    slug: ex.slug,
    title: resolveTranslation(ex.title, locale),
    description: ex.description ? resolveTranslation(ex.description, locale) : null,
    type: ex.type,
    status: ex.status,
    startDate: ex.startDate?.toISOString() ?? null,
    endDate: ex.endDate?.toISOString() ?? null,
    location: ex.location,
    imageUrl: ex.imageUrl,
    artists: ex.artists.map((a) => ({ name: a.artist.name, slug: a.artist.slug })),
  }));
}

export async function getExhibitionBySlugForFrontend(slug: string, locale: Locale = 'en') {
  const ex = await db.galleryExhibition.findUnique({
    where: { slug, visible: true },
    include: {
      artists: { include: { artist: { select: { name: true, slug: true, imageUrl: true } } } },
      artworks: {
        include: {
          artwork: {
            select: {
              id: true,
              slug: true,
              title: true,
              medium: true,
              dimensions: true,
              dimensionType: true,
              widthCm: true,
              heightCm: true,
              diameterCm: true,
              depthCm: true,
              year: true,
              imageUrl: true,
              artist: { select: { name: true, slug: true } },
            },
          },
        },
      },
    },
  });
  if (!ex) return null;
  return {
    id: ex.id,
    slug: ex.slug,
    title: resolveTranslation(ex.title, locale),
    description: ex.description ? resolveTranslation(ex.description, locale) : null,
    type: ex.type,
    status: ex.status,
    startDate: ex.startDate?.toISOString() ?? null,
    endDate: ex.endDate?.toISOString() ?? null,
    location: ex.location,
    imageUrl: ex.imageUrl,
    artists: ex.artists.map((a) => ({
      name: a.artist.name,
      slug: a.artist.slug,
      imageUrl: a.artist.imageUrl,
    })),
    artworks: ex.artworks.map((a) => ({
      id: a.artwork.id,
      slug: a.artwork.slug,
      title: resolveTranslation(a.artwork.title, locale),
      medium: a.artwork.medium ? resolveTranslation(a.artwork.medium, locale) : null,
      dimensions: formatArtworkDimensions({
        ...a.artwork,
        widthCm: a.artwork.widthCm ? Number(a.artwork.widthCm) : null,
        heightCm: a.artwork.heightCm ? Number(a.artwork.heightCm) : null,
        diameterCm: a.artwork.diameterCm ? Number(a.artwork.diameterCm) : null,
        depthCm: a.artwork.depthCm ? Number(a.artwork.depthCm) : null,
      }, locale),
      year: a.artwork.year,
      imageUrl: a.artwork.imageUrl,
      artistName: a.artwork.artist.name,
      artistSlug: a.artwork.artist.slug,
    })),
  };
}

export async function getAllExhibitionsAdmin() {
  const rows = await db.galleryExhibition.findMany({
    orderBy: { sortOrder: 'asc' },
    include: {
      artists: { include: { artist: { select: { name: true } } } },
      _count: { select: { artworks: true } },
    },
  });
  return rows.map((row) => serializePrismaRow(row));
}

export async function getExhibitionById(id: string) {
  return db.galleryExhibition.findUnique({
    where: { id },
    include: {
      artists: { select: { artistId: true } },
      artworks: { select: { artworkId: true } },
    },
  });
}
