-- Existing rows remain explicitly unconfirmed. No row is inferred as rectangular
-- or circular and the historical free-text `dimensions` value is untouched.
CREATE TYPE "ArtworkDimensionType" AS ENUM ('UNCONFIRMED', 'RECTANGULAR', 'CIRCULAR');

ALTER TABLE "artwork"
  ADD COLUMN "dimensionType" "ArtworkDimensionType" NOT NULL DEFAULT 'UNCONFIRMED',
  ADD COLUMN "diameterCm" DECIMAL(10, 2),
  ADD COLUMN "depthCm" DECIMAL(10, 2),
  ALTER COLUMN "widthCm" TYPE DECIMAL(10, 2) USING "widthCm"::DECIMAL(10, 2),
  ALTER COLUMN "heightCm" TYPE DECIMAL(10, 2) USING "heightCm"::DECIMAL(10, 2);
