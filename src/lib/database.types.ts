export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string
          user_id: string
          title: string
          platform_preset: string
          settings: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          title: string
          platform_preset?: string
          settings?: Json
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['projects']['Insert']>
      }
      media_assets: {
        Row: {
          id: string
          user_id: string
          project_id: string | null
          asset_type: string
          storage_path: string
          duration_seconds: number | null
          file_name: string | null
          mime_type: string | null
          file_size: number | null
          width: number | null
          height: number | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['media_assets']['Row'], 'id' | 'created_at'> & { id?: string }
        Update: Partial<Database['public']['Tables']['media_assets']['Insert']>
      }
      caption_segments: {
        Row: {
          id: string
          user_id: string
          media_asset_id: string
          text: string
          start_time: number
          end_time: number
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['caption_segments']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string }
        Update: Partial<Database['public']['Tables']['caption_segments']['Insert']>
      }
      text_overlays: {
        Row: {
          id: string
          user_id: string
          project_id: string
          text: string
          type: string
          start_time: number
          end_time: number
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['text_overlays']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string }
        Update: Partial<Database['public']['Tables']['text_overlays']['Insert']>
      }
      render_jobs: {
        Row: {
          id: string
          user_id: string
          media_asset_id: string
          status: string
          progress: number
          request_json: Json
          result_json: Json | null
          error_message: string | null
          created_at: string
          updated_at: string
          completed_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['render_jobs']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string }
        Update: Partial<Database['public']['Tables']['render_jobs']['Insert']>
      }
      ai_generation_events: {
        Row: {
          id: string
          user_id: string
          task_type: string
          provider: string
          request_json: Json
          response_json: Json | null
          error_message: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['ai_generation_events']['Row'], 'id' | 'created_at'> & { id?: string }
        Update: Partial<Database['public']['Tables']['ai_generation_events']['Insert']>
      }
    }
  }
}
