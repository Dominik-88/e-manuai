-- Add new area types to support authentic JVS data
-- These types are required for water treatment, pumping stations, and wells

-- Add new enum values to typ_arealu
ALTER TYPE typ_arealu ADD VALUE IF NOT EXISTS 'úpravna vody';
ALTER TYPE typ_arealu ADD VALUE IF NOT EXISTS 'čerpací stanice';
ALTER TYPE typ_arealu ADD VALUE IF NOT EXISTS 'vrt';