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
          created_at?: string | null
          updated_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['roads']['Insert']>
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
    }
    Enums: {
      landscape_type: LandscapeType
      poi_association_type: PoiAssociationType
    }
  }
}
