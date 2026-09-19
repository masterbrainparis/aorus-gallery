export const ARTWORK_STATUSES = ['available', 'reserved', 'sold'] as const;
export type ArtworkStatusFilter = (typeof ARTWORK_STATUSES)[number];

export interface ArtworkStatusFlags {
  sold: boolean;
  reserved: boolean;
}

export function isContradictoryArtworkStatus(flags: ArtworkStatusFlags): boolean {
  return flags.sold && flags.reserved;
}

/** Sold deliberately dominates legacy contradictory rows. */
export function getArtworkStatus(flags: ArtworkStatusFlags): ArtworkStatusFilter {
  if (flags.sold) return 'sold';
  if (flags.reserved) return 'reserved';
  return 'available';
}

export function matchesArtworkStatuses(
  flags: ArtworkStatusFlags,
  selected: readonly ArtworkStatusFilter[],
): boolean {
  return selected.length === 0 || selected.includes(getArtworkStatus(flags));
}

export function normalizeArtworkStatusChange(
  flags: ArtworkStatusFlags,
  field: 'sold' | 'reserved',
): ArtworkStatusFlags {
  if (field === 'sold') {
    const sold = !flags.sold;
    return { sold, reserved: sold ? false : flags.reserved };
  }
  const reserved = !flags.reserved;
  return { sold: reserved ? false : flags.sold, reserved };
}
