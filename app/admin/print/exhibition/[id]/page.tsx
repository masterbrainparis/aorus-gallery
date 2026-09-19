import { db } from '@/lib/db-typed';
import { notFound } from 'next/navigation';
import { resolveTranslation } from '@/lib/i18n-content';
import { ExhibitionViewClient } from '@/app/admin/(dashboard)/exhibitions/[id]/view/client';
import { formatArtworkDimensions } from '@/lib/artwork-dimensions';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ExhibitionPrintPage({ params }: Props) {
  const { id } = await params;
  const exhibition = await db.galleryExhibition.findUnique({
    where: { id },
    include: {
      artists: {
        include: {
          artist: {
            include: {
              artworks: { where: { visible: true }, take: 3, orderBy: { sortOrder: 'asc' } },
            },
          },
        },
      },
      artworks: {
        include: {
          artwork: true,
        },
      },
    },
  });
  if (!exhibition) notFound();

  const data = {
    title: resolveTranslation(exhibition.title, 'fr'),
    description: exhibition.description ? resolveTranslation(exhibition.description, 'fr') : null,
    type: exhibition.type as string,
    status: exhibition.status as string,
    startDate: exhibition.startDate?.toISOString() ?? null,
    endDate: exhibition.endDate?.toISOString() ?? null,
    location: exhibition.location,
    imageUrl: exhibition.imageUrl,
    artists: exhibition.artists.map((ea) => ({
      name: ea.artist.name,
      slug: ea.artist.slug,
      nationality: resolveTranslation(ea.artist.nationality, 'fr'),
      bio: resolveTranslation(ea.artist.bio, 'fr'),
      imageUrl: ea.artist.imageUrl,
    })),
    artworks: exhibition.artworks.map((ew) => ({
      title: resolveTranslation(ew.artwork.title, 'fr'),
      medium: ew.artwork.medium ? resolveTranslation(ew.artwork.medium, 'fr') : null,
      dimensions: formatArtworkDimensions({
        ...ew.artwork,
        widthCm: ew.artwork.widthCm ? Number(ew.artwork.widthCm) : null,
        heightCm: ew.artwork.heightCm ? Number(ew.artwork.heightCm) : null,
        diameterCm: ew.artwork.diameterCm ? Number(ew.artwork.diameterCm) : null,
        depthCm: ew.artwork.depthCm ? Number(ew.artwork.depthCm) : null,
      }, 'fr'),
      year: ew.artwork.year,
      imageUrl: ew.artwork.imageUrl,
      artistName: '',
    })),
  };

  return <ExhibitionViewClient exhibition={data} />;
}
