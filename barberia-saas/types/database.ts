export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  __InternalSupabase: {
    PostgrestVersion: "12"
  }
  public: {
    Tables: {
      barberias: {
        Row: {
          id: string
          slug: string
          nombre: string
          logo_url: string | null
          colores: Json
          configuracion: Json
          plan_saas: 'basico' | 'pro'
          activo: boolean
          created_at: string
        }
        Insert: {
          id?: string
          slug: string
          nombre: string
          logo_url?: string | null
          colores?: Json
          configuracion?: Json
          plan_saas?: 'basico' | 'pro'
          activo?: boolean
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['barberias']['Insert']>
        Relationships: []
      }
      users: {
        Row: {
          id: string
          barberia_id: string | null
          rol: 'superadmin' | 'admin' | 'barbero' | 'cliente'
          nombre: string
          telefono: string | null
          referral_code: string | null
          referral_by: string | null
          fcm_token: string | null
          activo: boolean
          created_at: string
        }
        Insert: {
          id: string
          barberia_id?: string | null
          rol?: 'superadmin' | 'admin' | 'barbero' | 'cliente'
          nombre?: string
          telefono?: string | null
          referral_code?: string | null
          referral_by?: string | null
          fcm_token?: string | null
          activo?: boolean
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['users']['Insert']>
        Relationships: []
      }
      barberos: {
        Row: {
          id: string
          barberia_id: string
          user_id: string | null
          nombre: string
          foto_url: string | null
          horarios: Json
          activo: boolean
          created_at: string
        }
        Insert: {
          id?: string
          barberia_id: string
          user_id?: string | null
          nombre: string
          foto_url?: string | null
          horarios?: Json
          activo?: boolean
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['barberos']['Insert']>
        Relationships: []
      }
      servicios: {
        Row: {
          id: string
          barberia_id: string
          nombre: string
          descripcion: string | null
          duracion_min: number
          precio: number
          activo: boolean
          orden: number
          created_at: string
        }
        Insert: {
          id?: string
          barberia_id: string
          nombre: string
          descripcion?: string | null
          duracion_min?: number
          precio: number
          activo?: boolean
          orden?: number
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['servicios']['Insert']>
        Relationships: []
      }
      disponibilidad: {
        Row: {
          id: string
          barbero_id: string
          barberia_id: string
          fecha: string
          slots: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          barbero_id: string
          barberia_id: string
          fecha: string
          slots?: Json
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['disponibilidad']['Insert']>
        Relationships: []
      }
      reservas: {
        Row: {
          id: string
          barberia_id: string
          cliente_id: string | null
          barbero_id: string
          servicio_id: string
          fecha_hora: string
          estado: 'pendiente' | 'confirmada' | 'completada' | 'cancelada' | 'no_show'
          precio: number
          descuento: number
          precio_final: number
          notas: string | null
          cliente_email: string | null
          cliente_nombre: string | null
          origen: 'web' | 'admin' | 'suscripcion'
          created_at: string
        }
        Insert: {
          id?: string
          barberia_id: string
          cliente_id?: string | null
          barbero_id: string
          servicio_id: string
          fecha_hora: string
          estado?: 'pendiente' | 'confirmada' | 'completada' | 'cancelada' | 'no_show'
          precio: number
          descuento?: number
          precio_final: number
          notas?: string | null
          cliente_email?: string | null
          cliente_nombre?: string | null
          origen?: 'web' | 'admin' | 'suscripcion'
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['reservas']['Insert']>
        Relationships: []
      }
      notificaciones: {
        Row: {
          id: string
          barberia_id: string
          usuario_id: string | null
          tipo: string
          titulo: string
          mensaje: string
          leida: boolean
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          barberia_id: string
          usuario_id?: string | null
          tipo: string
          titulo: string
          mensaje: string
          leida?: boolean
          metadata?: Json
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['notificaciones']['Insert']>
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_my_barberia_id: {
        Args: Record<PropertyKey, never>
        Returns: string | null
      }
      get_my_rol: {
        Args: Record<PropertyKey, never>
        Returns: 'superadmin' | 'admin' | 'barbero' | 'cliente' | null
      }
    }
  }
}
