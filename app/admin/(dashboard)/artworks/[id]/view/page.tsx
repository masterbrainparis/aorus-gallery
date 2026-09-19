import { db } from '@/lib/db-typed';
import { notFound } from 'next/navigation';
import { resolveTranslation } from '@/lib/i18n-content';
import { ArtworkViewClient } from './client';
import { formatArtworkDimensions } from '@/lib/artwork-dimensions';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ArtworkViewPage({ params }: Props) {
  const { id } = await params;
  const artwork = await db.artwork.findUnique({
    where: { id },
    include: { artist: true },
  });
  if (!artwork) notFound();

  const imagesMeta = (artwork.imagesMeta as Array<{ width: number | null; height: number | null }> | null) ?? [];

  const data = {
    id: artwork.id,
    slug: artwork.slug,
    title: resolveTranslation(artwork.title, 'fr'),
    medium: artwork.medium ? resolveTranslation(artwork.medium, 'fr') : null,
    dimensions: formatArtworkDimensions({
      ...artwork,
      widthCm: artwork.widthCm ? Number(artwork.widthCm) : null,
      heightCm: artwork.heightCm ? Number(artwork.heightCm) : null,
      diameterCm: artwork.diameterCm ? Number(artwork.diameterCm) : null,
      depthCm: artwork.depthCm ? Number(artwork.depthCm) : null,
    }, 'fr'),
    year: artwork.year,
    price: artwork.price ? Number(artwork.price) : null,
    currency: artwork.currency,
    showPrice: artwork.showPrice,
    sold: artwork.sold,
    imageUrl: artwork.imageUrl,
    imageWidth: artwork.imageWidth,
    imageHeight: artwork.imageHeight,
    images: artwork.images.map((src, i) => ({
      src,
      width: imagesMeta[i]?.width ?? null,
      height: imagesMeta[i]?.height ?? null,
    })),
    artist: {
      name: artwork.artist.name,
      nationality: resolveTranslation(artwork.artist.nationality, 'fr'),
      bio: resolveTranslation(artwork.artist.bio, 'fr'),
      imageUrl: artwork.artist.imageUrl,
    },
  };

  return <ArtworkViewClient artwork={data} />;
}
