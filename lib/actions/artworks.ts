'use server';

import { db } from '@/lib/db-typed';
import { Prisma } from '@prisma/client';
import { requireAuth } from '@/lib/auth-utils';
import { revalidateEntity } from '@/lib/actions/helpers';
import { redirect } from 'next/navigation';
import { extractTranslatable, type TranslatableField } from '@/lib/i18n-content';
import { serializeTranslatable, readDimension, readImagesMeta } from '@/lib/schemas/common';
import { slugify } from '@/lib/slugify';
import { parseFormData } from '@/lib/actions/safe-action';
import { normalizeArtworkStatusChange } from '@/lib/artwork-status';
import { artworkSchema } from '@/lib/schemas/artwork';

export async function createArtwork(formData: FormData): Promise<{ error: string } | void> {
  await requireAuth();

  const images = formData.getAll('images').map((v) => v.toString()).filter(Boolean);

  const raw = {
    title: extractTranslatable(formData, 'title'),
    artistId: formData.get('artistId')?.toString() ?? '',
    medium: extractTranslatable(formData, 'medium'),
    dimensions: formData.get('dimensions')?.toString() ?? '',
    dimensionType: formData.get('dimensionType')?.toString() ?? 'UNCONFIRMED',
    widthCm: formData.get('widthCm')?.toString() ?? '',
    heightCm: formData.get('heightCm')?.toString() ?? '',
    diameterCm: formData.get('diameterCm')?.toString() ?? '',
    depthCm: formData.get('depthCm')?.toString() ?? '',
    year: formData.get('year')?.toString() ?? '',
    price: formData.get('price')?.toString() ?? '',
    currency: formData.get('currency')?.toString() ?? 'EUR',
    imageUrl: formData.get('imageUrl')?.toString() ?? '',
    images,
    visible: formData.get('visible')?.toString() ?? 'false',
    sortOrder: formData.get('sortOrder')?.toString() ?? '0',
    featuredHome: formData.get('featuredHome')?.toString() ?? 'false',
    showPrice: formData.get('showPrice')?.toString() ?? 'false',
    sold: formData.get('sold')?.toString() ?? 'false',
    reserved: formData.get('reserved')?.toString() ?? 'false',
    statusTouched: formData.get('statusTouched')?.toString() ?? 'true',
    countries: formData.getAll('countries').map((v) => v.toString()).filter(Boolean),
    internalNote: formData.get('internalNote')?.toString() ?? '',
  };
  const parsed = parseFormData(artworkSchema, raw);
  if (!parsed.success) return { error: parsed.error };
  const data = parsed.data;
  const { statusTouched: _statusTouched, ...artworkData } = data;
  void _statusTouched;
  const imageWidth = readDimension(formData, 'imageUrlWidth');
  const imageHeight = readDimension(formData, 'imageUrlHeight');
  const imagesMeta = readImagesMeta(formData, 'imagesMeta');

  const artist = await db.artist.findUnique({ where: { id: data.artistId }, select: { slug: true } });
  const artistSlug = artist?.slug ?? 'unknown';
  const slug = slugify(artistSlug + '-' + data.title.en);

  let createdId = '';
  try {
    const created = await db.artwork.create({
      data: {
        ...artworkData,
        slug,
        medium: serializeTranslatable(data.medium),
        dimensions: data.dimensions || null,
        widthCm: data.widthCm ?? null,
        heightCm: data.heightCm ?? null,
        diameterCm: data.diameterCm ?? null,
        depthCm: data.depthCm ?? null,
        price: data.price ?? null,
        year: data.year ?? null,
        imageWidth,
        imageHeight,
        imagesMeta: imagesMeta ?? undefined,
        internalNote: data.internalNote || null,
      },
      select: { id: true },
    });
    createdId = created.id;
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      return { error: 'Un élément avec ce nom existe déjà. Veuillez choisir un autre nom.' };
    }
    throw e;
  }

  revalidateEntity('/admin/artworks', ['/artists', '']);
  redirect(`/admin/artworks?created=${createdId}`);
}

export async function updateArtwork(id: string, formData: FormData): Promise<{ error: string } | void> {
  await requireAuth();

  const existing = await db.artwork.findUnique({
    where: { id },
    select: { id: true, title: true, artistId: true },
  });
  if (!existing) return { error: 'Élément introuvable' };

  const images = formData.getAll('images').map((v) => v.toString()).filter(Boolean);

  const raw = {
    title: extractTranslatable(formData, 'title'),
    artistId: formData.get('artistId')?.toString() ?? '',
    medium: extractTranslatable(formData, 'medium'),
    dimensions: formData.get('dimensions')?.toString() ?? '',
    dimensionType: formData.get('dimensionType')?.toString() ?? 'UNCONFIRMED',
    widthCm: formData.get('widthCm')?.toString() ?? '',
    heightCm: formData.get('heightCm')?.toString() ?? '',
    diameterCm: formData.get('diameterCm')?.toString() ?? '',
    depthCm: formData.get('depthCm')?.toString() ?? '',
    year: formData.get('year')?.toString() ?? '',
    price: formData.get('price')?.toString() ?? '',
    currency: formData.get('currency')?.toString() ?? 'EUR',
    imageUrl: formData.get('imageUrl')?.toString() ?? '',
    images,
    visible: formData.get('visible')?.toString() ?? 'false',
    sortOrder: formData.get('sortOrder')?.toString() ?? '0',
    featuredHome: formData.get('featuredHome')?.toString() ?? 'false',
    showPrice: formData.get('showPrice')?.toString() ?? 'false',
    sold: formData.get('sold')?.toString() ?? 'false',
    reserved: formData.get('reserved')?.toString() ?? 'false',
    statusTouched: formData.get('statusTouched')?.toString() ?? 'false',
    countries: formData.getAll('countries').map((v) => v.toString()).filter(Boolean),
    internalNote: formData.get('internalNote')?.toString() ?? '',
  };
  const parsed = parseFormData(artworkSchema, raw);
  if (!parsed.success) return { error: parsed.error };
  const data = parsed.data;
  const { statusTouched: _statusTouched, ...artworkData } = data;
  void _statusTouched;
  const imageWidth = readDimension(formData, 'imageUrlWidth');
  const imageHeight = readDimension(formData, 'imageUrlHeight');
  const imagesMeta = readImagesMeta(formData, 'imagesMeta');

  // Recalculate slug when title or artist changes
  const existingTitle = existing.title as TranslatableField | null;
  const titleChanged = data.title.en !== (existingTitle?.en ?? '');
  const artistChanged = data.artistId !== existing.artistId;
  let newSlug: string | undefined;

  if (titleChanged || artistChanged) {
    const artist = await db.artist.findUnique({ where: { id: data.artistId }, select: { slug: true } });
    const artistSlug = artist?.slug ?? 'unknown';
    newSlug = slugify(artistSlug + '-' + data.title.en);
  }

  try {
    await db.artwork.update({
      where: { id },
      data: {
        ...artworkData,
        ...(newSlug ? { slug: newSlug } : {}),
        medium: serializeTranslatable(data.medium),
        dimensions: data.dimensions || null,
        widthCm: data.widthCm ?? null,
        heightCm: data.heightCm ?? null,
        diameterCm: data.diameterCm ?? null,
        depthCm: data.depthCm ?? null,
        price: data.price ?? null,
        year: data.year ?? null,
        imageWidth,
        imageHeight,
        imagesMeta: imagesMeta ?? undefined,
        internalNote: data.internalNote || null,
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      return { error: 'Une oeuvre avec ce titre existe déjà. Veuillez choisir un autre titre.' };
    }
    throw e;
  }

  revalidateEntity('/admin/artworks', ['/artists', '']);
  redirect('/admin/artworks?saved=1');
}

export async function deleteArtwork(id: string): Promise<{ error: string } | void> {
  await requireAuth();
  const existing = await db.artwork.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return { error: 'Élément introuvable' };
  await db.artwork.delete({ where: { id } });
  revalidateEntity('/admin/artworks', ['/artists', '']);
}

const ARTWORK_TOGGLE_FIELDS = ['visible', 'featuredHome', 'showPrice', 'sold', 'reserved'] as const;

export async function toggleArtworkField(id: string, field: 'visible' | 'featuredHome' | 'showPrice' | 'sold' | 'reserved'): Promise<{ error: string } | void> {
  await requireAuth();
  if (!(ARTWORK_TOGGLE_FIELDS as readonly string[]).includes(field)) throw new Error('Invalid field');
  const current = await db.artwork.findUnique({
    where: { id },
    select: { visible: true, featuredHome: true, showPrice: true, sold: true, reserved: true },
  });
  if (!current) return { error: 'Élément introuvable' };
  const data = field === 'sold' || field === 'reserved'
    ? normalizeArtworkStatusChange(current, field)
    : { [field]: !current[field] };
  await db.artwork.update({ where: { id }, data });
  revalidateEntity('/admin/artworks', ['/artists', '']);
}
