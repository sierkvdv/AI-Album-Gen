-- Add missing columns to Generation table
ALTER TABLE "Generation" ADD COLUMN IF NOT EXISTS "aspectRatio" TEXT DEFAULT 'square';
ALTER TABLE "Generation" ADD COLUMN IF NOT EXISTS "width" INTEGER DEFAULT 1024;
ALTER TABLE "Generation" ADD COLUMN IF NOT EXISTS "height" INTEGER DEFAULT 1024;

-- Update existing records to have default values
UPDATE "Generation" SET "aspectRatio" = 'square' WHERE "aspectRatio" IS NULL;
UPDATE "Generation" SET "width" = 1024 WHERE "width" IS NULL;
UPDATE "Generation" SET "height" = 1024 WHERE "height" IS NULL;
