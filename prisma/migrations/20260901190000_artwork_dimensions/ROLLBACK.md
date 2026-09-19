# Rollback — artwork dimensions

1. Revert the application commit first so no request writes the new fields.
2. Back up the `artwork` table.
3. Confirm there are no rows using `RECTANGULAR`, `CIRCULAR`, decimal values,
   `diameterCm`, or `depthCm`. If there are, export them and stop: converting the
   decimal columns back to integers would lose information.
4. Only after that check, remove `diameterCm`, `depthCm`, and `dimensionType`,
   cast `widthCm` and `heightCm` back to integers, then drop the enum.

The historical `dimensions` column is never changed by the forward migration,
so it remains the fallback throughout a rollback.
