import { db } from '@/lib/db-typed';
import { notFound } from 'next/navigation';
import { resolveTranslation } from '@/lib/i18n-content';
import { ArtistViewClient } from './client';
import { formatArtworkDimensions } from '@/lib/artwork-dimensions';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ArtistViewPage({ params }: Props) {
  const { id } = await params;
  const artist = await db.artist.findUnique({
    where: { id },
    include: {
      exhibitions: { orderBy: { sortOrder: 'asc' } },
      collections: { orderBy: { sortOrder: 'asc' } },
      artworks: { where: { visible: true }, orderBy: { sortOrder: 'asc' } },
    },
  });
  if (!artist) notFound();

  const data = {
    id: artist.id,
    name: artist.name,
    slug: artist.slug,
    nationality: resolveTranslation(artist.nationality, 'fr'),
    bio: resolveTranslation(artist.bio, 'fr'),
    imageUrl: artist.imageUrl,
    cv: {
      soloShows: artist.exhibitions.filter(e => e.type === 'SOLO_SHOW').map(e => resolveTranslation(e.title, 'fr')),
      groupShows: artist.exhibitions.filter(e => e.type === 'GROUP_SHOW').map(e => resolveTranslation(e.title, 'fr')),
      artFairs: artist.exhibitions.filter(e => e.type === 'ART_FAIR').map(e => resolveTranslation(e.title, 'fr')),
      residencies: artist.exhibitions.filter(e => e.type === 'RESIDENCY').map(e => resolveTranslation(e.title, 'fr')),
      awards: artist.exhibitions.filter(e => e.type === 'AWARD').map(e => resolveTranslation(e.title, 'fr')),
    },
    collections: artist.collections.map(c => resolveTranslation(c.title, 'fr')),
    artworks: artist.artworks.map(aw => ({
      title: resolveTranslation(aw.title, 'fr'),
      medium: aw.medium ? resolveTranslation(aw.medium, 'fr') : null,
      dimensions: formatArtworkDimensions({
        ...aw,
        widthCm: aw.widthCm ? Number(aw.widthCm) : null,
        heightCm: aw.heightCm ? Number(aw.heightCm) : null,
        diameterCm: aw.diameterCm ? Number(aw.diameterCm) : null,
        depthCm: aw.depthCm ? Number(aw.depthCm) : null,
      }, 'fr'),
      year: aw.year,
      imageUrl: aw.imageUrl,
    })),
  };

  return <ArtistViewClient artist={data} />;
}
