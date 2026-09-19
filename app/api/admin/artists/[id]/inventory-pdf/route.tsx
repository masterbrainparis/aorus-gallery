import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db-typed';
import { resolveTranslation } from '@/lib/i18n-content';
import { renderToBuffer } from '@react-pdf/renderer';
import { ArtistInventoryPdf, type PdfArtwork } from '@/lib/pdf/artist-inventory-pdf';
import { routing, type Locale } from '@/i18n/routing';
import { headers } from 'next/headers';
import { slugify } from '@/lib/slugify';

// Force Node runtime — @react-pdf/renderer ne tourne pas sur Edge.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Vercel maxDuration : un inventaire avec 50-100 œuvres + images distantes
// peut prendre 5-20s. Default Hobby = 10s, Pro = 60s. On force 60s pour
// éviter timeout sur les gros catalogues (no-op si plan free).
export const maxDuration = 60;

function parseLocale(raw: string | null): Locale {
  if (!raw) return 'fr';
  const candidate = raw.toLowerCase();
  if ((routing.locales as readonly string[]).includes(candidate)) {
    return candidate as Locale;
  }
  return 'fr';
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // Auth — 401 si non admin. Pattern défensif : on extrait `isAdmin` une fois
  // pour éviter une short-circuit ambigu si la lib auth change la forme du
  // session object.
  const session = await auth.api.getSession({ headers: await headers() });
  const isAdmin = session?.user?.role === 'admin';
  if (!isAdmin) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { id } = await params;
  const url = new URL(req.url);
  const locale = parseLocale(url.searchParams.get('locale'));

  const artist = await db.artist.findUnique({
    where: { id },
    include: { artworks: { orderBy: { sortOrder: 'asc' } } },
  });
  if (!artist) {
    return new Response('Artist not found', { status: 404 });
  }

  const artworks: PdfArtwork[] = artist.artworks.map((aw) => ({
    id: aw.id,
    title: resolveTranslation(aw.title, locale),
    year: aw.year,
    medium: aw.medium ? resolveTranslation(aw.medium, locale) : null,
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

  const buffer = await renderToBuffer(
    <ArtistInventoryPdf
      artist={{
        name: artist.name,
        nationality: resolveTranslation(artist.nationality, locale) || null,
      }}
      artworks={artworks}
      locale={locale}
    />,
  );

  // Filename : <ArtistSlug>_ORUS_Artwork_List.pdf — slugify() normalise NFD
  // et strip les accents (ex : "Renée" → "renee"), donc le filename ASCII
  // est safe pour `Content-Disposition`. On ajoute `filename*=UTF-8''` en
  // fallback RFC 5987 si on voulait préserver les accents — pas nécessaire
  // ici puisque slug ASCII-only.
  const filename = `${slugify(artist.name)}_ORUS_Artwork_List.pdf`;

  // Buffer → Blob : Next 16 Response BodyInit types n'acceptent ni Node
  // Buffer ni Uint8Array<ArrayBufferLike> selon les lib defs ; Blob est OK
  // sur toutes les runtimes.
  const blob = new Blob([new Uint8Array(buffer)], { type: 'application/pdf' });

  return new Response(blob, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
