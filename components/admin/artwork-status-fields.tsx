'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { AlertTriangle } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

interface ArtworkStatusFieldsProps {
  defaultSold: boolean;
  defaultReserved: boolean;
  isExisting: boolean;
}

export function ArtworkStatusFields({
  defaultSold,
  defaultReserved,
  isExisting,
}: ArtworkStatusFieldsProps) {
  const t = useTranslations('admin');
  const [sold, setSold] = useState(defaultSold);
  const [reserved, setReserved] = useState(defaultReserved);
  const [touched, setTouched] = useState(!isExisting);
  const contradictory = sold && reserved;

  return (
    <div className="space-y-3">
      {contradictory && (
        <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{t('artworks.inconsistentStatus')}</span>
        </div>
      )}
      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <Switch
            checked={sold}
            onCheckedChange={(checked) => {
              setTouched(true);
              setSold(checked);
              if (checked) setReserved(false);
            }}
            data-testid="switch-sold"
            className="data-[state=checked]:bg-emerald-600 data-[state=unchecked]:bg-gray-200"
          />
          {t('forms.sold')}
        </label>
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <Switch
            checked={reserved}
            onCheckedChange={(checked) => {
              setTouched(true);
              setReserved(checked);
              if (checked) setSold(false);
            }}
            data-testid="switch-reserved"
            className="data-[state=checked]:bg-emerald-600 data-[state=unchecked]:bg-gray-200"
          />
          {t('forms.reserved')}
        </label>
      </div>
      <input type="hidden" name="sold" value={sold ? 'true' : 'false'} />
      <input type="hidden" name="reserved" value={reserved ? 'true' : 'false'} />
      <input type="hidden" name="statusTouched" value={touched ? 'true' : 'false'} />
    </div>
  );
}
