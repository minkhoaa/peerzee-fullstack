-- ============================================================================
-- Migration: Enable PostGIS and Add Location Point for Distance-Based Search
-- ============================================================================

-- Step 1: Enable PostGIS Extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Step 2: Add locationPoint column to user_profiles
-- GEOMETRY(Point, 4326) uses WGS 84 coordinate system (standard GPS)
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS "locationPoint" geometry(Point, 4326);

-- Step 3: Create spatial index for fast distance queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_location_point
ON user_profiles USING GIST ("locationPoint");

-- Step 4: Populate locationPoint from existing latitude/longitude data
UPDATE user_profiles
SET "locationPoint" = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
WHERE latitude IS NOT NULL 
  AND longitude IS NOT NULL 
  AND "locationPoint" IS NULL;

-- Step 5: Create a trigger function to auto-update locationPoint when lat/long changes
CREATE OR REPLACE FUNCTION update_location_point()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update if latitude or longitude changed and both are not null
    IF (NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL) THEN
        NEW."locationPoint" := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
    ELSE
        NEW."locationPoint" := NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create trigger on user_profiles
DROP TRIGGER IF EXISTS trg_update_location_point ON user_profiles;
CREATE TRIGGER trg_update_location_point
BEFORE INSERT OR UPDATE OF latitude, longitude ON user_profiles
FOR EACH ROW
EXECUTE FUNCTION update_location_point();

-- Step 7: Verify setup
-- SELECT id, latitude, longitude, ST_AsText("locationPoint") as point_wkt 
-- FROM user_profiles 
-- WHERE "locationPoint" IS NOT NULL 
-- LIMIT 5;

-- Example distance query (for reference):
-- SELECT id, display_name,
--        ST_DistanceSphere("locationPoint", ST_SetSRID(ST_MakePoint(106.6297, 10.8231), 4326)) / 1000 as distance_km
-- FROM user_profiles
-- WHERE "locationPoint" IS NOT NULL
--   AND ST_DWithin(
--       "locationPoint"::geography,
--       ST_SetSRID(ST_MakePoint(106.6297, 10.8231), 4326)::geography,
--       50000  -- 50km in meters
--   )
-- ORDER BY distance_km ASC;
