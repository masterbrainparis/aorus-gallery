'use client';

import { useTranslations } from 'next-intl';
import { TranslatableInput } from './translatable-input';
import { FormSwitch } from './form-switch';
import { FormSelect } from './form-select';
import { ImageUpload } from './image-upload';
import { MultiImageUpload } from './multi-image-upload';
import { CountryMultiSelect } from './country-multi-select';
import type { TranslatableField } from '@/lib/i18n-content';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FormCard } from './form-card';
import { FormLayout } from './form-layout';
import { ArtworkDimensionsFields } from './artwork-dimensions-fields';
import { ArtworkStatusFields } from './artwork-status-fields';
import type { ArtworkDimensionType } from '@/lib/artwork-dimensions';

interface ArtworkFormProps {
  action: (formData: FormData) => Promise<{ error: string } | void>;
  artists: { id: string; name: string }[];
  isExisting?: boolean;
  defaultValues?: {
    title?: TranslatableField;
    artistId?: string;
    medium?: TranslatableField;
    dimensions?: string;
    dimensionType?: ArtworkDimensionType;
    widthCm?: number | null;
    heightCm?: number | null;
    diameterCm?: number | null;
    depthCm?: number | null;
    year?: number | null;
    price?: number | null;
    currency?: string;
    imageUrl?: string;
    images?: string[];
    sortOrder?: number;
    visible?: boolean;
    featuredHome?: boolean;
    showPrice?: boolean;
    sold?: boolean;
    reserved?: boolean;
    countries?: string[];
    internalNote?: string | null;
  };
}

export function ArtworkForm({ action, artists, isExisting = false, defaultValues = {} }: ArtworkFormProps) {
  const t = useTranslations('admin');
  const artistOptions = artists.map((a) => ({ value: a.id, label: a.name }));

  return (
    <FormLayout action={action}>
      <FormCard title={t('cards.artworkDetails')}>
          <TranslatableInput
            name="title"
            label={t('forms.title')}
            defaultValue={defaultValues.title}
            required
          />

          <FormSelect
            name="artistId"
            label={t('forms.artist')}
            options={artistOptions}
            defaultValue={defaultValues.artistId}
            required
            placeholder={t('forms.selectArtist')}
          />

          <TranslatableInput
            name="medium"
            label={t('forms.medium')}
            defaultValue={defaultValues.medium}
            placeholder={t('forms.mediumPlaceholder')}
          />

          <ArtworkDimensionsFields
            defaultValues={{
              dimensionType: defaultValues.dimensionType,
              dimensions: defaultValues.dimensions,
              widthCm: defaultValues.widthCm,
              heightCm: defaultValues.heightCm,
              diameterCm: defaultValues.diameterCm,
              depthCm: defaultValues.depthCm,
            }}
          />
      </FormCard>

      <FormCard title={t('cards.pricing')}>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="year" className="text-sm font-medium text-gray-700 mb-1.5">{t('forms.year')}</Label>
              <Input id="year" name="year" type="number" defaultValue={defaultValues.year ?? ''} />
            </div>
            <div>
              <Label htmlFor="price" className="text-sm font-medium text-gray-700 mb-1.5">{t('forms.price')}</Label>
              <Input id="price" name="price" type="number" step="0.01" defaultValue={defaultValues.price ?? ''} />
            </div>
            <FormSelect
              name="currency"
              label={t('forms.currency')}
              options={[
                { value: 'EUR', label: 'EUR' },
                { value: 'USD', label: 'USD' },
                { value: 'GBP', label: 'GBP' },
                { value: 'TWD', label: 'TWD' },
                { value: 'CNY', label: 'CNY' },
                { value: 'HKD', label: 'HKD' },
              ]}
              defaultValue={defaultValues.currency ?? 'EUR'}
            />
          </div>
      </FormCard>

      <FormCard title={t('cards.mediaDisplay')}>
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-1.5">{t('forms.image')} <span className="text-red-500">*</span></Label>
            <ImageUpload name="imageUrl" defaultValue={defaultValues?.imageUrl} required />
          </div>

          <div className="h-px bg-gray-100" />

          <div>
            <Label htmlFor="sortOrder" className="text-sm font-medium text-gray-700 mb-1.5">{t('forms.sortOrder')}</Label>
            <Input id="sortOrder" name="sortOrder" type="number" defaultValue={defaultValues.sortOrder ?? 0} className="max-w-32" />
          </div>

          <div className="h-px bg-gray-100" />

          <div className="flex flex-wrap gap-6">
            <FormSwitch name="visible" label={t('forms.visible')} defaultChecked={defaultValues.visible ?? true} />
            <FormSwitch name="featuredHome" label={t('forms.featuredHome')} defaultChecked={defaultValues.featuredHome ?? false} />
            <FormSwitch name="showPrice" label={t('forms.showPrice')} defaultChecked={defaultValues.showPrice ?? false} />
          </div>
          <ArtworkStatusFields
            defaultSold={defaultValues.sold ?? false}
            defaultReserved={defaultValues.reserved ?? false}
            isExisting={isExisting}
          />
      </FormCard>

      <FormCard title={t('cards.contextImages')}>
          <p className="text-sm text-gray-500">{t('cards.contextImagesDescription')}</p>
          <MultiImageUpload name="images" defaultValue={defaultValues?.images} maxImages={5} />
      </FormCard>

      <FormCard title={t('cards.internal')}>
        <p className="text-sm text-gray-500">{t('cards.internalDescription')}</p>
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-1.5">{t('forms.countries')}</Label>
          <CountryMultiSelect name="countries" defaultValue={defaultValues.countries ?? []} />
        </div>
        <div>
          <Label htmlFor="internalNote" className="text-sm font-medium text-gray-700 mb-1.5">{t('forms.internalNote')}</Label>
          <Textarea
            id="internalNote"
            name="internalNote"
            defaultValue={defaultValues.internalNote ?? ''}
            rows={4}
            maxLength={5000}
            placeholder={t('forms.internalNotePlaceholder')}
          />
        </div>
      </FormCard>

    </FormLayout>
  );
}
