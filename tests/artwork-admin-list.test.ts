import assert from 'node:assert/strict';
import test from 'node:test';
import { prepareArtworkAdminPage } from '@/lib/artwork-admin-list';
import {
  getArtworkStatus,
  isContradictoryArtworkStatus,
  normalizeArtworkStatusChange,
} from '@/lib/artwork-status';

const rows = Array.from({ length: 25 }, (_, index) => ({
  id: `work-${index}`,
  artistId: index < 15 ? 'owen' : 'anthea',
  artist: { name: index < 15 ? 'Owen Rival' : 'Anthea Xīn' },
  title: { fr: index === 22 ? 'Lune jade' : `Œuvre ${String(index).padStart(2, '0')}` },
  medium: { fr: index % 2 ? 'Huile' : 'Acrylique' },
  dimensions: index === 22 ? 'Ø 110 cm' : '90 × 120 cm',
  widthCm: index === 22 ? null : 90,
  heightCm: index === 22 ? null : 120,
  diameterCm: index === 22 ? 110 : null,
  depthCm: null,
  price: index * 100,
  sold: index === 2 || index === 22,
  reserved: index === 3 || index === 22,
  sortOrder: index,
}));

test('sold dominates a contradictory historical status', () => {
  const flags = { sold: true, reserved: true };
  assert.equal(getArtworkStatus(flags), 'sold');
  assert.equal(isContradictoryArtworkStatus(flags), true);
});

test('new status changes cannot keep sold and reserved together', () => {
  assert.deepEqual(normalizeArtworkStatusChange({ sold: false, reserved: true }, 'sold'), {
    sold: true,
    reserved: false,
  });
  assert.deepEqual(normalizeArtworkStatusChange({ sold: true, reserved: false }, 'reserved'), {
    sold: false,
    reserved: true,
  });
});

test('combines artist, OR statuses, search, sort and pagination over the full stock', () => {
  const page = prepareArtworkAdminPage(rows, {
    artistId: 'anthea',
    statuses: ['available', 'sold'],
    query: 'jade',
    sort: 'price',
    direction: 'desc',
    page: 1,
    pageSize: 20,
  });
  assert.equal(page.total, 1);
  assert.equal(page.items[0].id, 'work-22');
  assert.equal(getArtworkStatus(page.items[0]), 'sold');
});

test('paginates after global sorting rather than sorting one loaded page', () => {
  const page = prepareArtworkAdminPage(rows, {
    sort: 'price',
    direction: 'desc',
    page: 2,
    pageSize: 20,
  });
  assert.equal(page.total, 25);
  assert.deepEqual(page.items.map((row) => row.id), ['work-4', 'work-3', 'work-2', 'work-1', 'work-0']);
});
