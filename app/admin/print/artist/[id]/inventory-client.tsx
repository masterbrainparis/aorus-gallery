'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useTranslations, useLocale } from 'next-intl';
import { ArrowLeft, Printer, Package, Download } from 'lucide-react';
import { formatArtworkDimensions, type ArtworkDimensionType } from '@/lib/artwork-dimensions';

const GOLD = '#B59060';

export interface InventoryArtwork {
  id: string;
  slug: string;
  title: string;
  year: number | null;
  medium: string | null;
  dimensions: string | null;
  dimensionType: ArtworkDimensionType;
  widthCm: number | null;
  heightCm: number | null;
  diameterCm: number | null;
  depthCm: number | null;
  price: number | null;
  currency: string;
  imageUrl: string;
  visible: boolean;
  sold: boolean;
  reserved: boolean;
}

export interface InventoryArtist {
  id: string;
  name: string;
  slug: string;
  nationality: string | null;
}

interface Props {
  artist: InventoryArtist;
  artworks: InventoryArtwork[];
}

function formatPrice(price: number | null, currency: string): string {
  if (price === null) return '—';
  try {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency || 'EUR',
      maximumFractionDigits: 0,
    }).format(price);
  } catch {
    return `${price} ${currency}`;
  }
}

function statusFor(aw: InventoryArtwork, t: (k: string) => string) {
  if (aw.sold) return { label: t('inventory.status.sold'), color: 'bg-red-50 text-red-800 border-red-200' };
  if (aw.reserved) return { label: t('inventory.status.reserved'), color: 'bg-amber-50 text-amber-800 border-amber-200' };
  if (!aw.visible) return { label: t('inventory.status.hidden'), color: 'bg-gray-100 text-gray-700 border-gray-200' };
  return { label: t('inventory.status.available'), color: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
}

export function ArtistInventoryClient({ artist, artworks }: Props) {
  const t = useTranslations('admin.print');
  const locale = useLocale();
  const pdfHref = `/api/admin/artists/${artist.id}/inventory-pdf?locale=${locale}`;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6 md:px-12 print:bg-white print:px-0 print:py-0">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .inventory-row { break-inside: avoid; }
          @page { size: A4 landscape; margin: 12mm 10mm; }
        }
      `}</style>

      <div className="max-w-7xl mx-auto print:max-w-none">
        {/* Top toolbar — hidden on print */}
        <div className="no-print mb-8 flex items-center justify-between">
          <Link
            href={`/admin/artists/${artist.id}/view`}
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('backToArtists')}
          </Link>
          <div className="flex items-center gap-2">
            <a
              href={pdfHref}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
              data-testid="inventory-download-pdf-btn"
            >
              <Download className="h-4 w-4" />
              {t('inventory.downloadPdf')}
            </a>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
              data-testid="inventory-print-btn"
            >
              <Printer className="h-4 w-4" />
              {t('inventory.print')}
            </button>
          </div>
        </div>

        {/* Header */}
        <header className="mb-10 print:mb-6">
          <div className="flex items-baseline justify-between gap-4 mb-2">
            <p
              className="text-xs tracking-[0.3em] uppercase"
              style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', color: GOLD }}
            >
              ORUS Gallery — {t('inventory.title')}
            </p>
            <p className="text-xs text-gray-500 tabular-nums">
              {new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <h1
            className="text-4xl text-gray-900 tracking-wide"
            style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }}
          >
            {artist.name}
          </h1>
          {artist.nationality && (
            <p className="mt-1 text-sm text-gray-500">{artist.nationality}</p>
          )}
          <p className="mt-3 text-sm text-gray-600">
            {t('inventory.totalWorks', { count: artworks.length })}
          </p>
        </header>

        {/* Inventory table */}
        {artworks.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center text-sm text-gray-500">
            <Package className="h-8 w-8 mx-auto mb-3 text-gray-300" />
            {t('inventory.empty')}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm print:border-gray-300 print:shadow-none">
            <table className="min-w-full text-sm" data-testid="inventory-table">
              <thead className="bg-gray-50 print:bg-white">
                <tr className="text-left text-xs font-medium tracking-wider uppercase text-gray-500">
                  <th className="px-4 py-3 w-20">{t('inventory.cols.image')}</th>
                  <th className="px-4 py-3">{t('inventory.cols.title')}</th>
                  <th className="px-4 py-3 w-20">{t('inventory.cols.year')}</th>
                  <th className="px-4 py-3">{t('inventory.cols.medium')}</th>
                  <th className="px-4 py-3 w-40">{t('inventory.cols.dimensions')}</th>
                  <th className="px-4 py-3 w-32 text-right">{t('inventory.cols.price')}</th>
                  <th className="px-4 py-3 w-32">{t('inventory.cols.status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {artworks.map((aw) => {
                  const status = statusFor(aw, t);
                  const dims = formatArtworkDimensions(aw, locale) ?? '—';
                  return (
                    <tr key={aw.id} className="inventory-row hover:bg-gray-50 print:hover:bg-white">
                      <td className="px-4 py-3">
                        <div className="relative h-14 w-14 overflow-hidden rounded bg-gray-100">
                          <Image
                            src={aw.imageUrl}
                            alt={aw.title}
                            fill
                            sizes="56px"
                            className="object-cover"
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/artworks/${aw.id}/view`}
                          className="font-medium text-gray-900 hover:underline print:no-underline"
                        >
                          {aw.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-gray-600 tabular-nums">{aw.year ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{aw.medium ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-600 tabular-nums">{dims}</td>
                      <td className="px-4 py-3 text-right text-gray-900 tabular-nums">
                        {formatPrice(aw.price, aw.currency)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-medium ${status.color}`}
                        >
                          {status.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <p className="mt-6 text-xs text-gray-400 text-center print:mt-3">
          ORUS Gallery · {t('inventory.title')} · {artist.name}
        </p>
      </div>
    </div>
  );
}
