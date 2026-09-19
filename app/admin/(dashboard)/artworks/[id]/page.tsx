import { notFound } from 'next/navigation';
import { db } from '@/lib/db-typed';
import { updateArtwork } from '@/lib/actions/artworks';
import { ArtworkForm } from '@/components/admin/artwork-form';
import { AdminBreadcrumb } from '@/components/admin/admin-breadcrumb';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditArtworkPage({ params }: Props) {
  const { id } = await params;

  const [artwork, artists] = await Promise.all([
    db.artwork.findUnique({ where: { id } }),
    db.artist.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
  ]);

  if (!artwork) notFound();

  const updateWithId = updateArtwork.bind(null, artwork.id);
  const title = artwork.title.fr || artwork.title.en || 'Œuvre';

  return (
    <div className="space-y-6">
      <AdminBreadcrumb items={[
        { label: 'Œuvres', href: '/admin/artworks' },
        { label: `Modifier : ${title}` },
      ]} />

      <h1 className="text-2xl font-bold tracking-tight">Modifier : {title}</h1>

      <ArtworkForm
        action={updateWithId}
        artists={artists}
        isExisting
        defaultValues={{
          title: artwork.title,
          artistId: artwork.artistId,
          medium: artwork.medium ?? undefined,
          dimensions: artwork.dimensions ?? '',
          dimensionType: artwork.dimensionType,
          widthCm: artwork.widthCm ? Number(artwork.widthCm) : null,
          heightCm: artwork.heightCm ? Number(artwork.heightCm) : null,
          diameterCm: artwork.diameterCm ? Number(artwork.diameterCm) : null,
          depthCm: artwork.depthCm ? Number(artwork.depthCm) : null,
          year: artwork.year,
          price: artwork.price ? Number(artwork.price) : null,
          currency: artwork.currency,
          imageUrl: artwork.imageUrl,
          images: artwork.images,
          sortOrder: artwork.sortOrder,
          visible: artwork.visible,
          featuredHome: artwork.featuredHome,
          showPrice: artwork.showPrice,
          sold: artwork.sold,
          reserved: artwork.reserved,
          countries: artwork.countries,
          internalNote: artwork.internalNote,
        }}
      />
    </div>
  );
}
