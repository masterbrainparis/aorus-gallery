import assert from 'node:assert/strict';
import test from 'node:test';
import { formatArtworkDimensions } from '@/lib/artwork-dimensions';
import { artworkSchema } from '@/lib/schemas/artwork';

const baseArtwork = {
  title: { fr: 'Titre', en: 'Title', zh: '作品' },
  artistId: 'artist-1',
  medium: { fr: '', en: '', zh: '' },
  dimensions: '',
  year: null,
  price: null,
  currency: 'EUR',
  imageUrl: 'https://example.com/artwork.jpg',
  images: [],
  visible: true,
  sortOrder: 0,
  featuredHome: false,
  showPrice: false,
  sold: false,
  reserved: false,
  statusTouched: true,
  countries: [],
  internalNote: '',
};

test('formats rectangular decimal dimensions in each locale', () => {
  const dimensions = {
    dimensionType: 'RECTANGULAR' as const,
    widthCm: 90.5,
    heightCm: 120.25,
    depthCm: 4.5,
  };
  assert.equal(formatArtworkDimensions(dimensions, 'fr'), '90,5 × 120,25 cm · profondeur 4,5 cm');
  assert.equal(formatArtworkDimensions(dimensions, 'en'), '90.5 × 120.25 cm · depth 4.5 cm');
  assert.equal(formatArtworkDimensions(dimensions, 'zh'), '90.5 × 120.25 cm · 深度 4.5 cm');
});

test('formats a circular artwork without rectangular dimensions', () => {
  assert.equal(formatArtworkDimensions({ dimensionType: 'CIRCULAR', diameterCm: 110 }, 'fr'), 'Ø 110 cm');
});

test('keeps the legacy string while classification is unconfirmed', () => {
  assert.equal(formatArtworkDimensions({
    dimensionType: 'UNCONFIRMED',
    dimensions: '42 × 57 cm, encadrée',
    widthCm: 42,
    heightCm: 57,
  }), '42 × 57 cm, encadrée');
});

test('validates explicit rectangular and circular shapes', () => {
  assert.equal(artworkSchema.safeParse({
    ...baseArtwork,
    dimensionType: 'RECTANGULAR',
    widthCm: '12.5',
    heightCm: '30.25',
    diameterCm: '',
    depthCm: '',
  }).success, true);

  assert.equal(artworkSchema.safeParse({
    ...baseArtwork,
    dimensionType: 'CIRCULAR',
    widthCm: '12',
    heightCm: '',
    diameterCm: '110',
    depthCm: '',
  }).success, false);
});

test('does not force conversion or status cleanup on an untouched legacy edit', () => {
  assert.equal(artworkSchema.safeParse({
    ...baseArtwork,
    dimensions: '100 x 80 cm',
    dimensionType: 'UNCONFIRMED',
    widthCm: '100',
    heightCm: '80',
    diameterCm: '',
    depthCm: '',
    sold: true,
    reserved: true,
    statusTouched: false,
  }).success, true);
});
