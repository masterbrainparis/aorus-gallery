import { z } from 'zod';
import { ARTWORK_DIMENSION_TYPES } from '@/lib/artwork-dimensions';
import { booleanFromString, httpsUrl } from '@/lib/schemas/common';
import { optionalTranslatableSchema, translatableSchema } from '@/lib/i18n-content';

const optionalPositiveDecimal = z.preprocess(
  (value) => value === '' || value === null || value === undefined ? null : value,
  z.coerce.number().positive().max(100000).nullable(),
);

export const artworkSchema = z.object({
  title: translatableSchema,
  artistId: z.string().min(1),
  medium: optionalTranslatableSchema,
  dimensions: z.string().max(200).optional().default(''),
  dimensionType: z.enum(ARTWORK_DIMENSION_TYPES).default('UNCONFIRMED'),
  widthCm: optionalPositiveDecimal,
  heightCm: optionalPositiveDecimal,
  diameterCm: optionalPositiveDecimal,
  depthCm: optionalPositiveDecimal,
  year: z.coerce.number().int().min(0).optional().nullable(),
  price: z.coerce.number().min(0).optional().nullable(),
  currency: z.string().default('EUR'),
  imageUrl: httpsUrl,
  images: z.array(z.string().url()).optional().default([]),
  visible: booleanFromString.default(true),
  sortOrder: z.coerce.number().int().min(0).default(0),
  featuredHome: booleanFromString.default(false),
  showPrice: booleanFromString.default(false),
  sold: booleanFromString.default(false),
  reserved: booleanFromString.default(false),
  statusTouched: booleanFromString.default(true),
  countries: z.array(z.string().regex(/^[A-Z]{2}$/)).max(50).default([]),
  internalNote: z.string().max(5000).optional().default(''),
}).superRefine((data, context) => {
  if (data.dimensionType === 'RECTANGULAR') {
    if (data.widthCm === null || data.heightCm === null) {
      context.addIssue({ code: 'custom', path: ['widthCm'], message: 'Largeur et longueur sont requises.' });
    }
    if (data.diameterCm !== null) {
      context.addIssue({ code: 'custom', path: ['diameterCm'], message: 'Une œuvre rectangulaire ne peut pas avoir de diamètre.' });
    }
  }
  if (data.dimensionType === 'CIRCULAR') {
    if (data.diameterCm === null) {
      context.addIssue({ code: 'custom', path: ['diameterCm'], message: 'Le diamètre est requis.' });
    }
    if (data.widthCm !== null || data.heightCm !== null) {
      context.addIssue({ code: 'custom', path: ['widthCm'], message: 'Une œuvre circulaire ne peut pas avoir de dimensions rectangulaires.' });
    }
  }
  if (data.statusTouched && data.sold && data.reserved) {
    context.addIssue({ code: 'custom', path: ['sold'], message: 'Une œuvre ne peut pas être vendue et réservée simultanément.' });
  }
});
