export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type LandscapeType =
  | 'coast'
  | 'mountain'
  | 'forest'
  | 'urban'
  | 'river_valley'
  | 'mixed'
  | 'plains'

export type PoiAssociationType = 'on_route' | 'near_route' | 'detour'

export type GeoLevel =
  | 'continent'
  | 'country'
  | 'macro_region'
  | 'historic_province'
  | 'natural_park'
  | 'district'
  | 'municipality'

// ---- Domain interfaces for frontend use ----

export interface AlternativeGeoJSON {
  type: 'LineString' | 'MultiLineString' | 'GeometryCollection'
  coordinates: number[][] | number[][][] | unknown[]
}

export interface Road {
  id: string
  code: string
  designation: string | null
  hero_image_url: string | null
  country_code: string | null
  total_distance_km: number | null
  description: string | null
}

export interface RoadAlternative {
  id: string
  road_id: string
  name: string
  slug: string
  description: string | null
  is_default: boolean
  display_order: number
  distance_km: number | null
  elevation_gain: number | null
  elevation_max: number | null
  geometry_geojson: AlternativeGeoJSON | null
  created_by: string | null
}

export interface RoadWithAlternatives extends Road {
  alternatives: RoadAlternative[]
  defaultAlternative: RoadAlternative | null
  alt_count: number
}

export interface GeographicArea {
  id: string
  name: string
  slug: string
  level: GeoLevel
  parent_id: string | null
  country_code: string | null
  display_order: number
  description: string | null
  hero_image_url: string | null
  route_count: number
}

export interface Database {
  public: {
    Tables: {
      roads: {
        Row: {
          id: string
          code: string
          designation: string | null
          status: string | null
          is_continuous: boolean | null
          description: string | null
          wikipedia_url: string | null
          hero_image_url: string | null
          country_code: string | null
          total_distance_km: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          code: string
          designation?: string | null
          status?: string | null
          is_continuous?: boolean | null
          description?: string | null
          wikipedia_url?: string | null
          hero_image_url?: string | null
          country_code?: string | null
          total_distance_km?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['roads']['Insert']>
      }
      road_alternatives: {
        Row: {
          id: string
          road_id: string
          name: string
          slug: string
          description: string | null
          is_default: boolean
          display_order: number
          distance_km: number | null
          elevation_gain: number | null
          elevation_max: number | null
          geometry_geojson: Json | null
          created_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          road_id: string
          name: string
          slug: string
          description?: string | null
          is_default?: boolean
          display_order?: number
          distance_km?: number | null
          elevation_gain?: number | null
          elevation_max?: number | null
          geometry_geojson?: Json | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['road_alternatives']['Insert']>
      }
      alternative_segments: {
        Row: {
          id: string
          alternative_id: string
          route_id: string
          segment_order: number
          replaces_route_id: string | null
        }
        Insert: {
          id?: string
          alternative_id: string
          route_id: string
          segment_order: number
          replaces_route_id?: string | null
        }
        Update: Partial<Database['public']['Tables']['alternative_segments']['Insert']>
      }
      geographic_areas: {
        Row: {
          id: string
          name: string
          slug: string
          level: GeoLevel
          parent_id: string | null
          country_code: string | null
          display_order: number
          description: string | null
          hero_image_url: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          slug: string
          level: GeoLevel
          parent_id?: string | null
          country_code?: string | null
          display_order?: number
          description?: string | null
          hero_image_url?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['geographic_areas']['Insert']>
      }
      route_geographic_areas: {
        Row: {
          route_id: string
          area_id: string
          is_auto: boolean
        }
        Insert: {
          route_id: string
          area_id: string
          is_auto?: boolean
        }
        Update: Partial<Database['public']['Tables']['route_geographic_areas']['Insert']>
      }
      routes: {
        Row: {
          id: string
          code: string
          name: string
          slug: string
          description: string | null
          geometry: unknown
          geometry_geojson: Json | null
          distance_km: number | null
          elevation_max: number | null
          elevation_min: number | null
          elevation_gain: number | null
          elevation_loss: number | null
          curve_count_total: number | null
          curve_count_gentle: number | null
          curve_count_moderate: number | null
          curve_count_sharp: number | null
          surface: string | null
          difficulty: string | null
          landscape_type: LandscapeType | null
          data_source: string | null
          road_id: string | null
          is_segment_of: string | null
          is_extension_of: string | null
          is_variant_of: string | null
          is_featured: boolean
          highlight_note_pt: string | null
          highlight_note_en: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          code: string
          name: string
          slug: string
          description?: string | null
          geometry: unknown
          geometry_geojson?: Json | null
          distance_km?: number | null
          elevation_max?: number | null
          elevation_min?: number | null
          elevation_gain?: number | null
          elevation_loss?: number | null
          curve_count_total?: number | null
          curve_count_gentle?: number | null
          curve_count_moderate?: number | null
          curve_count_sharp?: number | null
          surface?: string | null
          difficulty?: string | null
          landscape_type?: LandscapeType | null
          data_source?: string | null
          road_id?: string | null
          is_segment_of?: string | null
          is_extension_of?: string | null
          is_variant_of?: string | null
          is_featured?: boolean
          highlight_note_pt?: string | null
          highlight_note_en?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['routes']['Insert']>
      }
      journeys: {
        Row: {
          id: string
          name: string
          slug: string
          type: string | null
          description: string | null
          suggested_days: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          slug: string
          type?: string | null
          description?: string | null
          suggested_days?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['journeys']['Insert']>
      }
      journey_stages: {
        Row: {
          id: string
          journey_id: string
          route_id: string
          stage_order: number
          stage_name: string | null
        }
        Insert: {
          id?: string
          journey_id: string
          route_id: string
          stage_order: number
          stage_name?: string | null
        }
        Update: Partial<Database['public']['Tables']['journey_stages']['Insert']>
      }
      destinations: {
        Row: {
          id: string
          name: string
          slug: string
          bounding_box: unknown | null
          description: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          slug: string
          bounding_box?: unknown | null
          description?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['destinations']['Insert']>
      }
      destination_featured_routes: {
        Row: {
          destination_id: string
          route_id: string
          display_order: number | null
        }
        Insert: {
          destination_id: string
          route_id: string
          display_order?: number | null
        }
        Update: Partial<Database['public']['Tables']['destination_featured_routes']['Insert']>
      }
      pois: {
        Row: {
          id: string
          name: string
          type: string
          geometry: unknown
          description: string | null
          association_type: PoiAssociationType | null
          distance_meters: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          type: string
          geometry: unknown
          description?: string | null
          association_type?: PoiAssociationType | null
          distance_meters?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['pois']['Insert']>
      }
      route_pois: {
        Row: {
          route_id: string
          poi_id: string
          km_marker: number | null
        }
        Insert: {
          route_id: string
          poi_id: string
          km_marker?: number | null
        }
        Update: Partial<Database['public']['Tables']['route_pois']['Insert']>
      }
      user_favorites: {
        Row: {
          user_id: string
          route_id: string
          created_at: string | null
        }
        Insert: {
          user_id: string
          route_id: string
          created_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['user_favorites']['Insert']>
      }
      user_history: {
        Row: {
          id: string
          user_id: string
          route_id: string
          viewed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          route_id: string
          viewed_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['user_history']['Insert']>
      }
      translations: {
        Row: {
          id: string
          entity_type: string
          entity_id: string
          field: string
          lang: string
          value: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          entity_type: string
          entity_id: string
          field: string
          lang: string
          value: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['translations']['Insert']>
      }
    }
    Views: Record<string, never>
    Functions: {
      get_destinations: {
        Args: Record<string, never>
        Returns: {
          id: string
          name: string
          slug: string
          description: string | null
          bounding_box_geojson: unknown
        }[]
      }
      get_pois_for_route: {
        Args: { p_route_id: string }
        Returns: {
          id: string
          name: string
          type: string
          description: string | null
          association_type: string
          distance_meters: number | null
          km_marker: number | null
          longitude: number
          latitude: number
        }[]
      }
      get_roads_with_alternatives: {
        Args: Record<string, never>
        Returns: {
          road_id: string
          road_code: string
          road_designation: string | null
          road_country_code: string | null
          road_total_distance_km: number | null
          alt_id: string | null
          alt_name: string | null
          alt_slug: string | null
          alt_is_default: boolean | null
          alt_display_order: number | null
          alt_distance_km: number | null
          alt_elevation_gain: number | null
          alt_elevation_max: number | null
          alt_geometry_geojson: Json | null
          alt_count: number
        }[]
      }
      get_geographic_areas: {
        Args: { p_level?: string | null; p_parent_id?: string | null }
        Returns: {
          id: string
          name: string
          slug: string
          level: GeoLevel
          parent_id: string | null
          country_code: string | null
          display_order: number
          description: string | null
          route_count: number
        }[]
      }
      get_routes_in_area: {
        Args: { p_area_id: string }
        Returns: { route_id: string; road_id: string | null }[]
      }
    }
    Enums: {
      landscape_type: LandscapeType
      poi_association_type: PoiAssociationType
      geo_level: GeoLevel
    }
  }
}
