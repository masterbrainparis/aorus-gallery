import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import sharp from 'sharp';
import { preparePdfArtworkImages, preparePdfImage } from '../lib/pdf/prepare-pdf-image.ts';
import { ArtistInventoryPdf, type PdfArtwork } from '../lib/pdf/artist-inventory-pdf.tsx';

test('converts a WebP data URI into a JPEG source supported by React PDF', async () => {
  const webp = await sharp({
    create: {
      width: 20,
      height: 10,
      channels: 4,
      background: { r: 20, g: 100, b: 180, alpha: 1 },
    },
  }).webp().toBuffer();

  const source = `data:image/webp;base64,${webp.toString('base64')}`;
  const prepared = await preparePdfImage(source);

  assert.match(prepared, /^data:image\/jpeg;base64,/);
  const jpeg = Buffer.from(prepared.split(',')[1], 'base64');
  const metadata = await sharp(jpeg).metadata();
  assert.equal(metadata.format, 'jpeg');
  assert.equal(metadata.width, 176);
  assert.equal(metadata.height, 176);
});

test('embeds the prepared thumbnail in the generated inventory PDF', async () => {
  const png = await sharp({
    create: {
      width: 20,
      height: 20,
      channels: 4,
      background: { r: 180, g: 80, b: 30, alpha: 1 },
    },
  }).png().toBuffer();

  const imageUrl = await preparePdfImage(`data:image/png;base64,${png.toString('base64')}`);
  const artwork: PdfArtwork = {
    id: 'artwork-1',
    title: 'Test artwork',
    year: 2026,
    medium: 'Oil on canvas',
    dimensions: null,
    dimensionType: 'RECTANGULAR',
    widthCm: 100,
    heightCm: 80,
    diameterCm: null,
    depthCm: null,
    price: 4_500,
    currency: 'EUR',
    imageUrl,
    visible: true,
    sold: false,
    reserved: false,
  };

  const pdf = await renderToBuffer(React.createElement(ArtistInventoryPdf, {
    artist: { name: 'Test Artist', nationality: 'French' },
    artworks: [artwork],
    locale: 'fr',
  }));

  assert.match(pdf.toString('latin1'), /\/Subtype \/Image/);
});

test('keeps artwork order and replaces invalid images with a safe placeholder source', async () => {
  const artworks = [
    { id: 'first', imageUrl: 'https://evil.example.com/image.webp' },
    { id: 'second', imageUrl: 'not-a-url' },
  ];

  const prepared = await preparePdfArtworkImages(artworks, 2);

  assert.deepEqual(prepared, [
    { id: 'first', imageUrl: '' },
    { id: 'second', imageUrl: '' },
  ]);
});
