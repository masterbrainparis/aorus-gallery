'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ArtworkDimensionType } from '@/lib/artwork-dimensions';

interface ArtworkDimensionsFieldsProps {
  defaultValues: {
    dimensionType?: ArtworkDimensionType;
    dimensions?: string;
    widthCm?: number | null;
    heightCm?: number | null;
    diameterCm?: number | null;
    depthCm?: number | null;
  };
}

export function ArtworkDimensionsFields({ defaultValues }: ArtworkDimensionsFieldsProps) {
  const t = useTranslations('admin.forms');
  const [dimensionType, setDimensionType] = useState<ArtworkDimensionType>(
    defaultValues.dimensionType ?? 'UNCONFIRMED',
  );
  const numericProps = { type: 'number', min: '0.01', step: '0.01', inputMode: 'decimal' } as const;

  return (
    <div className="space-y-4 rounded-lg border border-gray-200 bg-gray-50/60 p-4">
      <div>
        <Label htmlFor="dimensionType" className="mb-1.5 text-sm font-medium text-gray-700">
          {t('dimensionType')}
        </Label>
        <select
          id="dimensionType"
          name="dimensionType"
          value={dimensionType}
          onChange={(event) => setDimensionType(event.target.value as ArtworkDimensionType)}
          className="h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
        >
          <option value="UNCONFIRMED">{t('dimensionTypes.unconfirmed')}</option>
          <option value="RECTANGULAR">{t('dimensionTypes.rectangular')}</option>
          <option value="CIRCULAR">{t('dimensionTypes.circular')}</option>
        </select>
      </div>

      {dimensionType === 'UNCONFIRMED' ? (
        <div>
          <Label htmlFor="dimensions" className="mb-1.5 text-sm font-medium text-gray-700">
            {t('legacyDimensions')}
          </Label>
          <Input
            id="dimensions"
            name="dimensions"
            defaultValue={defaultValues.dimensions ?? ''}
            placeholder="120 × 90 cm, 48 × 36 in, profondeur 4 cm…"
          />
          <p className="mt-1.5 text-xs leading-relaxed text-amber-700">{t('legacyDimensionsHelp')}</p>
          <input type="hidden" name="widthCm" value={defaultValues.widthCm ?? ''} />
          <input type="hidden" name="heightCm" value={defaultValues.heightCm ?? ''} />
          <input type="hidden" name="diameterCm" value={defaultValues.diameterCm ?? ''} />
          <input type="hidden" name="depthCm" value={defaultValues.depthCm ?? ''} />
        </div>
      ) : (
        <>
          <input type="hidden" name="dimensions" value={defaultValues.dimensions ?? ''} />
          {dimensionType === 'RECTANGULAR' ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="widthCm" className="mb-1.5 text-sm font-medium text-gray-700">{t('widthCm')}</Label>
                <Input id="widthCm" name="widthCm" {...numericProps} defaultValue={defaultValues.widthCm ?? ''} placeholder="90" required />
              </div>
              <div>
                <Label htmlFor="heightCm" className="mb-1.5 text-sm font-medium text-gray-700">{t('lengthCm')}</Label>
                <Input id="heightCm" name="heightCm" {...numericProps} defaultValue={defaultValues.heightCm ?? ''} placeholder="120" required />
              </div>
              <input type="hidden" name="diameterCm" value="" />
            </div>
          ) : (
            <div>
              <Label htmlFor="diameterCm" className="mb-1.5 text-sm font-medium text-gray-700">{t('diameterCm')}</Label>
              <Input id="diameterCm" name="diameterCm" {...numericProps} defaultValue={defaultValues.diameterCm ?? ''} placeholder="110" required />
              <input type="hidden" name="widthCm" value="" />
              <input type="hidden" name="heightCm" value="" />
            </div>
          )}
          <div>
            <Label htmlFor="depthCm" className="mb-1.5 text-sm font-medium text-gray-700">{t('depthCm')}</Label>
            <Input id="depthCm" name="depthCm" {...numericProps} defaultValue={defaultValues.depthCm ?? ''} placeholder="4" />
          </div>
          {defaultValues.dimensions && (
            <p className="text-xs leading-relaxed text-gray-500">
              {t('preservedLegacyDimensions')}: {defaultValues.dimensions}
            </p>
          )}
        </>
      )}
    </div>
  );
}
