import { db } from '@/lib/db-typed';
import { notFound } from 'next/navigation';
import { resolveTranslation } from '@/lib/i18n-content';
import { ExhibitionViewClient } from './client';
import { formatArtworkDimensions } from '@/lib/artwork-dimensions';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ExhibitionViewPage({ params }: Props) {
  const { id } = await params;
  const exhibition = await db.galleryExhibition.findUnique({
    where: { id },
    include: {
      artists: {
        include: {
          artist: {
            select: { name: true, slug: true, imageUrl: true, bio: true, nationality: true },
          },
        },
      },
      artworks: {
        include: {
          artwork: {
            select: {
              title: true,
              imageUrl: true,
              medium: true,
              dimensions: true,
              dimensionType: true,
              widthCm: true,
              heightCm: true,
              diameterCm: true,
              depthCm: true,
              year: true,
              artist: { select: { name: true } },
            },
          },
        },
      },
    },
  });
  if (!exhibition) notFound();

  function statusLabel(status: string) {
    switch (status) {
      case 'CURRENT': return 'En cours';
      case 'UPCOMING': return 'À venir';
      default: return 'Passée';
    }
  }

  function typeLabel(type: string) {
    switch (type) {
      case 'EXHIBITION': return 'Exposition';
      case 'ART_FAIR': return 'Foire';
      case 'OFFSITE': return 'Hors les murs';
      default: return type;
    }
  }

  function formatDate(date: Date | null) {
    if (!date) return null;
    return date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  const data = {
    title: resolveTranslation(exhibition.title, 'fr'),
    description: exhibition.description
      ? resolveTranslation(exhibition.description, 'fr')
      : null,
    type: typeLabel(exhibition.type),
    status: statusLabel(exhibition.status),
    startDate: formatDate(exhibition.startDate),
    endDate: formatDate(exhibition.endDate),
    location: exhibition.location,
    imageUrl: exhibition.imageUrl,
    artists: exhibition.artists.map((a) => ({
      name: a.artist.name,
      slug: a.artist.slug,
      imageUrl: a.artist.imageUrl,
      nationality: resolveTranslation(a.artist.nationality, 'fr'),
      bio: resolveTranslation(a.artist.bio, 'fr'),
    })),
    artworks: exhibition.artworks.map((aw) => ({
      title: resolveTranslation(aw.artwork.title, 'fr'),
      imageUrl: aw.artwork.imageUrl,
      medium: aw.artwork.medium ? resolveTranslation(aw.artwork.medium, 'fr') : null,
      dimensions: formatArtworkDimensions({
        ...aw.artwork,
        widthCm: aw.artwork.widthCm ? Number(aw.artwork.widthCm) : null,
        heightCm: aw.artwork.heightCm ? Number(aw.artwork.heightCm) : null,
        diameterCm: aw.artwork.diameterCm ? Number(aw.artwork.diameterCm) : null,
        depthCm: aw.artwork.depthCm ? Number(aw.artwork.depthCm) : null,
      }, 'fr'),
      year: aw.artwork.year,
      artistName: aw.artwork.artist.name,
    })),
  };

  return <ExhibitionViewClient exhibition={data} />;
}
