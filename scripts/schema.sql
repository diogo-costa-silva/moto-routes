-- ============================================================================
-- Moto Routes v4 - Database Schema
-- ============================================================================
-- PostgreSQL + PostGIS
-- SRID: 4326 (WGS84)
-- CRITICAL: Coordinates are always (longitude, latitude) - longitude first!
-- ============================================================================

-- Enable PostGIS extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Landscape types for route classification
CREATE TYPE landscape_type AS ENUM (
  'coast',
  'mountain',
  'forest',
  'urban',
  'river_valley',
  'mixed',
  'plains'
);

-- POI association types
CREATE TYPE poi_association_type AS ENUM (
  'on_route',    -- Exactly on the route (0m)
  'near_route',  -- Close, no detour needed (<500m)
  'detour'       -- Requires leaving route (>500m)
);

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Abstract road designations (optional reference)
CREATE TABLE roads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
  designation TEXT,
  status TEXT,
  is_continuous BOOLEAN DEFAULT true,
  description TEXT,
  wikipedia_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Main routes table - the core entity
CREATE TABLE routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,

  -- Geometry (PostGIS)
  geometry GEOMETRY(LineString, 4326) NOT NULL,
  geometry_geojson JSON, -- Cached GeoJSON for frontend performance

  -- Distance and elevation
  distance_km DECIMAL(10, 2),
  elevation_max INTEGER,
  elevation_min INTEGER,
  elevation_gain INTEGER,
  elevation_loss INTEGER,

  -- Curve analysis
  curve_count_total INTEGER DEFAULT 0,
  curve_count_gentle INTEGER DEFAULT 0,
  curve_count_moderate INTEGER DEFAULT 0,
  curve_count_sharp INTEGER DEFAULT 0,

  -- Classification
  surface TEXT,
  difficulty TEXT,
  landscape_type landscape_type,
  data_source TEXT,

  -- Relationships
  road_id UUID REFERENCES roads(id),
  is_segment_of UUID REFERENCES routes(id),
  is_extension_of UUID REFERENCES routes(id),
  is_variant_of UUID REFERENCES routes(id),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Multi-stage trip compositions
CREATE TABLE journeys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  type TEXT, -- linear, circular, etc.
  description TEXT,
  suggested_days INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Links journeys to routes with ordering
CREATE TABLE journey_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id UUID NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,
  route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  stage_order INTEGER NOT NULL,
  stage_name TEXT,
  UNIQUE(journey_id, stage_order)
);

-- Geographic regions for discovery
CREATE TABLE destinations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  bounding_box GEOMETRY(Polygon, 4326),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Featured routes for destinations
CREATE TABLE destination_featured_routes (
  destination_id UUID NOT NULL REFERENCES destinations(id) ON DELETE CASCADE,
  route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  display_order INTEGER DEFAULT 0,
  PRIMARY KEY (destination_id, route_id)
);

-- Points of interest
CREATE TABLE pois (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- viewpoint, restaurant, fuel_station, historical_site, etc.
  geometry GEOMETRY(Point, 4326) NOT NULL,
  description TEXT,
  association_type poi_association_type,
  distance_meters INTEGER, -- Distance from nearest route point
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Links routes to POIs
CREATE TABLE route_pois (
  route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  poi_id UUID NOT NULL REFERENCES pois(id) ON DELETE CASCADE,
  km_marker DECIMAL(10, 2), -- Position on route (km from start)
  PRIMARY KEY (route_id, poi_id)
);

-- ============================================================================
-- USER TABLES
-- ============================================================================

-- User's saved routes
CREATE TABLE user_favorites (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, route_id)
);

-- Routes viewed by user
CREATE TABLE user_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- SUPPORT TABLES
-- ============================================================================

-- i18n support for content
CREATE TABLE translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL, -- routes, journeys, destinations, pois
  entity_id UUID NOT NULL,
  field TEXT NOT NULL, -- name, description
  lang TEXT NOT NULL, -- pt, en
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(entity_type, entity_id, field, lang)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Spatial indexes (CRITICAL for PostGIS performance)
CREATE INDEX routes_geometry_idx ON routes USING GIST (geometry);
CREATE INDEX pois_geometry_idx ON pois USING GIST (geometry);
CREATE INDEX destinations_bbox_idx ON destinations USING GIST (bounding_box);

-- Foreign key indexes
CREATE INDEX journey_stages_journey_idx ON journey_stages (journey_id);
CREATE INDEX journey_stages_route_idx ON journey_stages (route_id);
CREATE INDEX route_pois_route_idx ON route_pois (route_id);
CREATE INDEX route_pois_poi_idx ON route_pois (poi_id);
CREATE INDEX user_favorites_user_idx ON user_favorites (user_id);
CREATE INDEX user_favorites_route_idx ON user_favorites (route_id);
CREATE INDEX user_history_user_idx ON user_history (user_id);
CREATE INDEX user_history_route_idx ON user_history (route_id);
CREATE INDEX destination_featured_routes_dest_idx ON destination_featured_routes (destination_id);

-- Lookup indexes
CREATE INDEX routes_slug_idx ON routes (slug);
CREATE INDEX routes_code_idx ON routes (code);
CREATE INDEX routes_landscape_type_idx ON routes (landscape_type);
CREATE INDEX journeys_slug_idx ON journeys (slug);
CREATE INDEX destinations_slug_idx ON destinations (slug);
CREATE INDEX translations_entity_idx ON translations (entity_type, entity_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE roads ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE journey_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE destination_featured_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pois ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_pois ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE translations ENABLE ROW LEVEL SECURITY;

-- Public read access for content tables
CREATE POLICY "Public read access" ON roads
  FOR SELECT TO public USING (true);

CREATE POLICY "Public read access" ON routes
  FOR SELECT TO public USING (true);

CREATE POLICY "Public read access" ON journeys
  FOR SELECT TO public USING (true);

CREATE POLICY "Public read access" ON journey_stages
  FOR SELECT TO public USING (true);

CREATE POLICY "Public read access" ON destinations
  FOR SELECT TO public USING (true);

CREATE POLICY "Public read access" ON destination_featured_routes
  FOR SELECT TO public USING (true);

CREATE POLICY "Public read access" ON pois
  FOR SELECT TO public USING (true);

CREATE POLICY "Public read access" ON route_pois
  FOR SELECT TO public USING (true);

CREATE POLICY "Public read access" ON translations
  FOR SELECT TO public USING (true);

-- User favorites: users can only access their own
CREATE POLICY "Users read own favorites" ON user_favorites
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own favorites" ON user_favorites
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own favorites" ON user_favorites
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- User history: users can only access their own
CREATE POLICY "Users read own history" ON user_history
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own history" ON user_history
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to tables with updated_at column
CREATE TRIGGER update_roads_updated_at
  BEFORE UPDATE ON roads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_routes_updated_at
  BEFORE UPDATE ON routes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_journeys_updated_at
  BEFORE UPDATE ON journeys
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_destinations_updated_at
  BEFORE UPDATE ON destinations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_pois_updated_at
  BEFORE UPDATE ON pois
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_translations_updated_at
  BEFORE UPDATE ON translations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- RPC FUNCTIONS (applied via Supabase migrations)
-- ============================================================================

-- Returns POIs for a route with extracted lon/lat coordinates
-- Applied via migration (not inline — requires PostGIS ST_X/ST_Y)
-- Usage: supabase.rpc('get_pois_for_route', { p_route_id: uuid })
CREATE OR REPLACE FUNCTION get_pois_for_route(p_route_id uuid)
RETURNS TABLE (
  id uuid, name text, description text, poi_type text,
  association_type poi_association_type, km_marker numeric,
  longitude double precision, latitude double precision
)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT p.id, p.name, p.description, p.poi_type,
         rp.association_type, rp.km_marker,
         ST_X(p.location::geometry) AS longitude,
         ST_Y(p.location::geometry) AS latitude
  FROM route_pois rp
  JOIN pois p ON p.id = rp.poi_id
  WHERE rp.route_id = p_route_id
  ORDER BY rp.km_marker;
$$;
GRANT EXECUTE ON FUNCTION get_pois_for_route(uuid) TO public;

-- Returns all destinations with bounding box as GeoJSON polygon
-- Usage: supabase.rpc('get_destinations', {})
CREATE OR REPLACE FUNCTION get_destinations()
RETURNS TABLE (
  id uuid, name text, slug text, description text,
  landscape_type text, bounding_box_geojson json
)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT id, name, slug, description, landscape_type::text,
         ST_AsGeoJSON(bounding_box)::json
  FROM destinations ORDER BY name;
$$;
GRANT EXECUTE ON FUNCTION get_destinations() TO public;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE routes IS 'Main route entity with GPS geometry';
COMMENT ON COLUMN routes.geometry IS 'PostGIS LineString in SRID 4326. Coordinates: (longitude, latitude)';
COMMENT ON COLUMN routes.geometry_geojson IS 'Cached GeoJSON for frontend performance';
COMMENT ON COLUMN routes.is_segment_of IS 'Parent route if this is a segment';
COMMENT ON COLUMN routes.is_extension_of IS 'Parent route if this is an extension/detour';
COMMENT ON COLUMN routes.is_variant_of IS 'Parent route if this is an alternative variant';

COMMENT ON TABLE journeys IS 'Multi-stage trip compositions';
COMMENT ON TABLE destinations IS 'Geographic regions for route discovery';
COMMENT ON TABLE pois IS 'Points of interest along routes';

COMMENT ON TYPE landscape_type IS 'Classification of route landscape';
COMMENT ON TYPE poi_association_type IS 'How a POI relates to a route: on_route (0m), near_route (<500m), detour (>500m)';

-- ============================================================================
-- REFORM — Phase 11 (2026-03)
-- Roads → Alternatives → Segments + Geographic Areas
-- ============================================================================

-- Extend roads table
ALTER TABLE roads ADD COLUMN IF NOT EXISTS hero_image_url TEXT;
ALTER TABLE roads ADD COLUMN IF NOT EXISTS country_code TEXT DEFAULT 'pt';
ALTER TABLE roads ADD COLUMN IF NOT EXISTS total_distance_km NUMERIC(8,2);

-- Extend routes table
ALTER TABLE routes ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT true;
ALTER TABLE routes ADD COLUMN IF NOT EXISTS highlight_note_pt TEXT;
ALTER TABLE routes ADD COLUMN IF NOT EXISTS highlight_note_en TEXT;

-- Geographic level enum
DO $$ BEGIN
  CREATE TYPE geo_level AS ENUM (
    'continent', 'country', 'macro_region', 'historic_province',
    'natural_park', 'district', 'municipality'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Curated road alternatives (each road has 1+ alternatives with merged geometry)
CREATE TABLE IF NOT EXISTS road_alternatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  road_id UUID NOT NULL REFERENCES roads(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  distance_km NUMERIC(8,2),
  elevation_gain INTEGER,
  elevation_max INTEGER,
  geometry_geojson JSONB,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS road_alternatives_road_id_idx ON road_alternatives(road_id);
CREATE INDEX IF NOT EXISTS road_alternatives_slug_idx ON road_alternatives(slug);
ALTER TABLE road_alternatives ENABLE ROW LEVEL SECURITY;

-- Junction: which routes compose each alternative (ordered)
CREATE TABLE IF NOT EXISTS alternative_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alternative_id UUID NOT NULL REFERENCES road_alternatives(id) ON DELETE CASCADE,
  route_id UUID NOT NULL REFERENCES routes(id),
  segment_order INTEGER NOT NULL,
  replaces_route_id UUID REFERENCES routes(id),
  UNIQUE(alternative_id, segment_order)
);

CREATE INDEX IF NOT EXISTS alternative_segments_alternative_id_idx ON alternative_segments(alternative_id);
CREATE INDEX IF NOT EXISTS alternative_segments_route_id_idx ON alternative_segments(route_id);
ALTER TABLE alternative_segments ENABLE ROW LEVEL SECURITY;

-- Hierarchical geographic areas (continent → municipality)
CREATE TABLE IF NOT EXISTS geographic_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  level geo_level NOT NULL,
  parent_id UUID REFERENCES geographic_areas(id),
  geom GEOMETRY(MultiPolygon, 4326),
  country_code TEXT,
  display_order INTEGER DEFAULT 0,
  description TEXT,
  hero_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS geographic_areas_geom_idx ON geographic_areas USING GIST(geom);
CREATE INDEX IF NOT EXISTS geographic_areas_parent_id_idx ON geographic_areas(parent_id);
CREATE INDEX IF NOT EXISTS geographic_areas_level_idx ON geographic_areas(level);
CREATE INDEX IF NOT EXISTS geographic_areas_country_code_idx ON geographic_areas(country_code);
ALTER TABLE geographic_areas ENABLE ROW LEVEL SECURITY;

-- Routes ↔ geographic areas (auto-populated via PostGIS intersection)
CREATE TABLE IF NOT EXISTS route_geographic_areas (
  route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  area_id UUID NOT NULL REFERENCES geographic_areas(id) ON DELETE CASCADE,
  is_auto BOOLEAN DEFAULT true,
  PRIMARY KEY (route_id, area_id)
);

CREATE INDEX IF NOT EXISTS route_geographic_areas_area_id_idx ON route_geographic_areas(area_id);
ALTER TABLE route_geographic_areas ENABLE ROW LEVEL SECURITY;

-- RPC: roads with their alternatives (for frontend listing)
CREATE OR REPLACE FUNCTION get_roads_with_alternatives()
RETURNS TABLE (
  road_id uuid, road_code text, road_designation text,
  road_country_code text, road_total_distance_km numeric,
  alt_id uuid, alt_name text, alt_slug text, alt_is_default boolean,
  alt_display_order integer, alt_distance_km numeric,
  alt_elevation_gain integer, alt_elevation_max integer,
  alt_geometry_geojson jsonb, alt_count bigint
)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    r.id, r.code, r.designation, r.country_code, r.total_distance_km,
    ra.id, ra.name, ra.slug, ra.is_default, ra.display_order,
    ra.distance_km, ra.elevation_gain, ra.elevation_max, ra.geometry_geojson,
    COUNT(ra2.id) OVER (PARTITION BY r.id)
  FROM roads r
  LEFT JOIN road_alternatives ra ON ra.road_id = r.id
  LEFT JOIN road_alternatives ra2 ON ra2.road_id = r.id
  ORDER BY r.code, ra.display_order;
$$;
GRANT EXECUTE ON FUNCTION get_roads_with_alternatives() TO public;

-- RPC: geographic areas with route counts
CREATE OR REPLACE FUNCTION get_geographic_areas(p_level geo_level DEFAULT NULL, p_parent_id uuid DEFAULT NULL)
RETURNS TABLE (
  id uuid, name text, slug text, level geo_level,
  parent_id uuid, country_code text, display_order integer,
  description text, route_count bigint
)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    ga.id, ga.name, ga.slug, ga.level, ga.parent_id,
    ga.country_code, ga.display_order, ga.description,
    COUNT(DISTINCT rga.route_id) AS route_count
  FROM geographic_areas ga
  LEFT JOIN route_geographic_areas rga ON rga.area_id = ga.id
  WHERE (p_level IS NULL OR ga.level = p_level)
    AND (p_parent_id IS NULL OR ga.parent_id = p_parent_id)
  GROUP BY ga.id
  ORDER BY ga.display_order, ga.name;
$$;
GRANT EXECUTE ON FUNCTION get_geographic_areas(geo_level, uuid) TO public;

-- RPC: auto-populate route_geographic_areas via PostGIS intersection
CREATE OR REPLACE FUNCTION populate_route_geographic_areas()
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE rows_inserted INTEGER;
BEGIN
  INSERT INTO route_geographic_areas (route_id, area_id, is_auto)
  SELECT r.id, g.id, true
  FROM routes r
  CROSS JOIN geographic_areas g
  WHERE g.geom IS NOT NULL
    AND ST_Intersects(r.geometry, g.geom)
  ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS rows_inserted = ROW_COUNT;
  RETURN rows_inserted;
END;
$$;
GRANT EXECUTE ON FUNCTION populate_route_geographic_areas() TO postgres;

-- RPC: routes in a geographic area
CREATE OR REPLACE FUNCTION get_routes_in_area(p_area_id uuid)
RETURNS TABLE (route_id uuid, road_id uuid)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT rga.route_id, r.road_id
  FROM route_geographic_areas rga
  JOIN routes r ON r.id = rga.route_id
  WHERE rga.area_id = p_area_id;
$$;
GRANT EXECUTE ON FUNCTION get_routes_in_area(uuid) TO public;

-- RPC: get boundary GeoJSON for a geographic area
CREATE OR REPLACE FUNCTION get_area_boundary(p_area_id uuid)
RETURNS TABLE (geojson text)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT ST_AsGeoJSON(geom)::text AS geojson
  FROM geographic_areas
  WHERE id = p_area_id AND geom IS NOT NULL;
$$;
GRANT EXECUTE ON FUNCTION get_area_boundary(uuid) TO public;
