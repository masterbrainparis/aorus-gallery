import { db } from '@/lib/db-typed';
import { notFound } from 'next/navigation';
import { resolveTranslation } from '@/lib/i18n-content';
import { ArtistInventoryClient, type InventoryArtwork } from './inventory-client';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ArtistInventoryPage({ params }: Props) {
  const { id } = await params;
  const artist = await db.artist.findUnique({
    where: { id },
    include: {
      // Inventory: ALL artworks (visible AND hidden), sorted by admin sortOrder.
      // Counter to the public artist view which filters visible:true and slices.
      artworks: { orderBy: { sortOrder: 'asc' } },
    },
  });
  if (!artist) notFound();

  const artworks: InventoryArtwork[] = artist.artworks.map((aw) => ({
    id: aw.id,
    slug: aw.slug,
    title: resolveTranslation(aw.title, 'fr'),
    year: aw.year,
    medium: aw.medium ? resolveTranslation(aw.medium, 'fr') : null,
    dimensions: aw.dimensions,
    dimensionType: aw.dimensionType,
    widthCm: aw.widthCm ? Number(aw.widthCm) : null,
    heightCm: aw.heightCm ? Number(aw.heightCm) : null,
    diameterCm: aw.diameterCm ? Number(aw.diameterCm) : null,
    depthCm: aw.depthCm ? Number(aw.depthCm) : null,
    price: aw.price ? Number(aw.price) : null,
    currency: aw.currency,
    imageUrl: aw.imageUrl,
    visible: aw.visible,
    sold: aw.sold,
    reserved: aw.reserved,
  }));

  return (
    <ArtistInventoryClient
      artist={{
        id: artist.id,
        name: artist.name,
        slug: artist.slug,
        nationality: resolveTranslation(artist.nationality, 'fr'),
      }}
      artworks={artworks}
    />
  );
}
