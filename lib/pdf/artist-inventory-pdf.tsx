import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import type { Locale } from '@/i18n/routing';
import { formatArtworkDimensions, type ArtworkDimensionType } from '@/lib/artwork-dimensions';

// Fonts : PDF built-in uniquement (Times-Roman / Helvetica). Pas de TTF
// custom à charger côté serveur → zéro risque de path resolution sur Vercel
// serverless, bundle minimal. Times-Roman = display (proche du Cormorant
// Garamond stylistiquement, classique galerie), Helvetica = body. Upgrade
// vers Cormorant possible en v2 via @react-pdf Font.register + TTF bundlé
// dans `lib/fonts/` (commité comme code).
const FONT_DISPLAY = 'Times-Roman';
const FONT_BODY = 'Helvetica';
const FONT_BODY_BOLD = 'Helvetica-Bold';

const GOLD = '#B59060';
const NOIR = '#0B0B0B';
const STONE = '#6E6E6E';
const HAIRLINE = '#E6E6E6';

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 48,
    paddingHorizontal: 32,
    fontFamily: FONT_BODY,
    fontSize: 9,
    color: NOIR,
    backgroundColor: '#FFFFFF',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 4,
  },
  eyebrow: {
    fontFamily: FONT_DISPLAY,
    color: GOLD,
    fontSize: 9,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  dateLabel: { fontSize: 8, color: STONE },
  artistName: {
    fontFamily: FONT_DISPLAY,
    fontSize: 28,
    marginTop: 4,
    color: NOIR,
  },
  nationality: { fontSize: 9, color: STONE, marginTop: 2 },
  totalWorks: { fontSize: 9, color: STONE, marginTop: 8 },
  divider: { borderBottomWidth: 0.5, borderBottomColor: HAIRLINE, marginTop: 16, marginBottom: 12 },

  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: NOIR,
    fontSize: 7,
    textTransform: 'uppercase',
    color: STONE,
    fontFamily: FONT_BODY_BOLD,
    letterSpacing: 1,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: HAIRLINE,
    minHeight: 56,
    alignItems: 'flex-start',
  },
  colImg: { width: 50, paddingRight: 6 },
  colTitle: { flex: 2.4, paddingRight: 6 },
  colYear: { width: 32, textAlign: 'center', paddingRight: 4 },
  colMedium: { flex: 1.6, paddingRight: 6 },
  colDimensions: { width: 78, paddingRight: 4 },
  colPrice: { width: 60, textAlign: 'right', paddingRight: 6 },
  colStatus: { width: 58 },

  thumb: {
    width: 44,
    height: 44,
    objectFit: 'cover',
    backgroundColor: '#F5F5F5',
  },
  thumbPlaceholder: {
    width: 44,
    height: 44,
    backgroundColor: '#F5F5F5',
  },

  titleText: { fontSize: 10, fontFamily: FONT_BODY_BOLD, color: NOIR },
  subtleText: { fontSize: 8, color: STONE, marginTop: 1 },
  bodyText: { fontSize: 9, color: NOIR },
  priceText: { fontSize: 9, color: NOIR, fontFamily: FONT_BODY_BOLD },

  statusPill: {
    fontSize: 7,
    paddingVertical: 2,
    paddingHorizontal: 5,
    borderRadius: 4,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: NOIR,
    backgroundColor: '#F0F0F0',
  },
  statusSold: { backgroundColor: '#FCEBEB', color: '#B42318' },
  statusReserved: { backgroundColor: '#FEF4E2', color: '#9B6A12' },
  statusHidden: { backgroundColor: '#EEEEEE', color: '#666666' },
  statusAvailable: { backgroundColor: '#E8F5EE', color: '#0F6F47' },

  footer: {
    position: 'absolute',
    bottom: 24,
    left: 32,
    right: 32,
    fontSize: 7,
    color: STONE,
    textAlign: 'center',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  pageNumber: {
    position: 'absolute',
    bottom: 24,
    right: 32,
    fontSize: 7,
    color: STONE,
  },
});

export interface PdfArtwork {
  id: string;
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

export interface PdfArtist {
  name: string;
  nationality: string | null;
}

interface I18nStrings {
  inventoryTitle: string;        // "Inventaire" / "Inventory" / "庫存清單"
  totalWorks: (count: number) => string;
  cols: {
    image: string;
    title: string;
    year: string;
    medium: string;
    dimensions: string;
    price: string;
    status: string;
  };
  status: {
    available: string;
    sold: string;
    reserved: string;
    hidden: string;
  };
  empty: string;
  generatedOn: string;
}

const STRINGS: Record<Locale, I18nStrings> = {
  fr: {
    inventoryTitle: 'Inventaire',
    totalWorks: (n) => `${n} œuvre${n > 1 ? 's' : ''}`,
    cols: { image: 'Image', title: 'Titre', year: 'Année', medium: 'Médium', dimensions: 'Dimensions', price: 'Prix', status: 'Statut' },
    status: { available: 'Disponible', sold: 'Vendue', reserved: 'Réservée', hidden: 'Masquée' },
    empty: 'Aucune œuvre dans cette fiche.',
    generatedOn: 'Document généré le',
  },
  en: {
    inventoryTitle: 'Inventory',
    totalWorks: (n) => `${n} artwork${n > 1 ? 's' : ''}`,
    cols: { image: 'Image', title: 'Title', year: 'Year', medium: 'Medium', dimensions: 'Dimensions', price: 'Price', status: 'Status' },
    status: { available: 'Available', sold: 'Sold', reserved: 'Reserved', hidden: 'Hidden' },
    empty: 'No artwork in this sheet.',
    generatedOn: 'Document generated on',
  },
  zh: {
    inventoryTitle: 'Inventory',
    totalWorks: (n) => `${n} works`,
    cols: { image: 'Image', title: 'Title', year: 'Year', medium: 'Medium', dimensions: 'Dimensions', price: 'Price', status: 'Status' },
    status: { available: 'Available', sold: 'Sold', reserved: 'Reserved', hidden: 'Hidden' },
    empty: 'No artwork available.',
    generatedOn: 'Document generated on',
  },
};

function formatPrice(price: number | null, currency: string, locale: Locale): string {
  if (price === null) return '—';
  try {
    return new Intl.NumberFormat(locale === 'zh' ? 'zh-Hant-TW' : locale, {
      style: 'currency',
      currency: currency || 'EUR',
      maximumFractionDigits: 0,
    }).format(price);
  } catch {
    return `${price} ${currency}`;
  }
}

function formatDate(locale: Locale): string {
  const d = new Date();
  return d.toLocaleDateString(locale === 'zh' ? 'zh-Hant-TW' : locale, { day: '2-digit', month: 'long', year: 'numeric' });
}

function statusOf(aw: PdfArtwork, s: I18nStrings['status']): { label: string; styleKey: keyof typeof styles } {
  if (aw.sold) return { label: s.sold, styleKey: 'statusSold' };
  if (aw.reserved) return { label: s.reserved, styleKey: 'statusReserved' };
  if (!aw.visible) return { label: s.hidden, styleKey: 'statusHidden' };
  return { label: s.available, styleKey: 'statusAvailable' };
}

function dimensionsOf(aw: PdfArtwork, locale: Locale): string {
  return formatArtworkDimensions(aw, locale) ?? '—';
}

export function ArtistInventoryPdf({
  artist,
  artworks,
  locale = 'fr',
}: {
  artist: PdfArtist;
  artworks: PdfArtwork[];
  locale?: Locale;
}) {
  // ZH falls back to EN headers + Helvetica because we don't ship a CJK font
  // in the PDF bundle yet (CJK TTFs > 16 Mo). Locale `zh` here uses Latin
  // labels; artist-side ZH content (titles, mediums) rendered in source as-is
  // but may not visualize if it contains CJK chars — known limitation.
  const t = STRINGS[locale];

  return (
    <Document
      title={`${artist.name} — ${t.inventoryTitle}`}
      author="ORUS Gallery"
      subject="Artist inventory sheet"
    >
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={styles.eyebrow}>ORUS Gallery — {t.inventoryTitle}</Text>
          <Text style={styles.dateLabel}>{formatDate(locale)}</Text>
        </View>
        <Text style={styles.artistName}>{artist.name}</Text>
        {artist.nationality ? <Text style={styles.nationality}>{artist.nationality}</Text> : null}
        <Text style={styles.totalWorks}>{t.totalWorks(artworks.length)}</Text>

        <View style={styles.divider} />

        {/* Table header */}
        <View style={styles.tableHeader} fixed>
          <Text style={styles.colImg}>{t.cols.image}</Text>
          <Text style={styles.colTitle}>{t.cols.title}</Text>
          <Text style={styles.colYear}>{t.cols.year}</Text>
          <Text style={styles.colMedium}>{t.cols.medium}</Text>
          <Text style={styles.colDimensions}>{t.cols.dimensions}</Text>
          <Text style={styles.colPrice}>{t.cols.price}</Text>
          <Text style={styles.colStatus}>{t.cols.status}</Text>
        </View>

        {/* Rows */}
        {artworks.length === 0 ? (
          <View style={{ paddingVertical: 24, alignItems: 'center' }}>
            <Text style={styles.subtleText}>{t.empty}</Text>
          </View>
        ) : (
          artworks.map((aw) => {
            const status = statusOf(aw, t.status);
            return (
              <View style={styles.row} key={aw.id} wrap={false}>
                <View style={styles.colImg}>
                  {aw.imageUrl ? (
                    /* eslint-disable-next-line jsx-a11y/alt-text */
                    <Image src={aw.imageUrl} style={styles.thumb} />
                  ) : (
                    <View style={styles.thumbPlaceholder} />
                  )}
                </View>
                <View style={styles.colTitle}>
                  <Text style={styles.titleText}>{aw.title || '—'}</Text>
                </View>
                <Text style={[styles.colYear, styles.bodyText]}>{aw.year ?? '—'}</Text>
                <Text style={[styles.colMedium, styles.bodyText]}>{aw.medium || '—'}</Text>
                <Text style={[styles.colDimensions, styles.bodyText]}>{dimensionsOf(aw, locale)}</Text>
                <Text style={[styles.colPrice, styles.priceText]}>{formatPrice(aw.price, aw.currency, locale)}</Text>
                <View style={styles.colStatus}>
                  <Text style={[styles.statusPill, styles[status.styleKey]]}>{status.label}</Text>
                </View>
              </View>
            );
          })
        )}

        <Text
          style={styles.footer}
          render={() => `ORUS Gallery · ${t.inventoryTitle} · ${artist.name}`}
          fixed
        />
        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          fixed
        />
      </Page>
    </Document>
  );
}
