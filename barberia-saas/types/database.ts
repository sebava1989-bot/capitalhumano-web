export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      alianzas: {
        Row: {
          activo: boolean
          barberia_id: string
          beneficio: string | null
          created_at: string
          descripcion: string | null
          id: string
          logo_url: string | null
          nombre: string
          tipo: string
        }
        Insert: {
          activo?: boolean
          barberia_id: string
          beneficio?: string | null
          created_at?: string
          descripcion?: string | null
          id?: string
          logo_url?: string | null
          nombre: string
          tipo?: string
        }
        Update: {
          activo?: boolean
          barberia_id?: string
          beneficio?: string | null
          created_at?: string
          descripcion?: string | null
          id?: string
          logo_url?: string | null
          nombre?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "alianzas_barberia_id_fkey"
            columns: ["barberia_id"]
            isOneToOne: false
            referencedRelation: "barberias"
            referencedColumns: ["id"]
          },
        ]
      }
      barberias: {
        Row: {
          activo: boolean
          colores: Json | null
          configuracion: Json | null
          created_at: string
          id: string
          logo_url: string | null
          nombre: string
          plan_saas: string
          slug: string
        }
        Insert: {
          activo?: boolean
          colores?: Json | null
          configuracion?: Json | null
          created_at?: string
          id?: string
          logo_url?: string | null
          nombre: string
          plan_saas?: string
          slug: string
        }
        Update: {
          activo?: boolean
          colores?: Json | null
          configuracion?: Json | null
          created_at?: string
          id?: string
          logo_url?: string | null
          nombre?: string
          plan_saas?: string
          slug?: string
        }
        Relationships: []
      }
      barberos: {
        Row: {
          activo: boolean
          barberia_id: string
          created_at: string
          foto_url: string | null
          horarios: Json
          id: string
          nombre: string
          user_id: string | null
        }
        Insert: {
          activo?: boolean
          barberia_id: string
          created_at?: string
          foto_url?: string | null
          horarios?: Json
          id?: string
          nombre: string
          user_id?: string | null
        }
        Update: {
          activo?: boolean
          barberia_id?: string
          created_at?: string
          foto_url?: string | null
          horarios?: Json
          id?: string
          nombre?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "barberos_barberia_id_fkey"
            columns: ["barberia_id"]
            isOneToOne: false
            referencedRelation: "barberias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "barberos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      campanas: {
        Row: {
          asunto: string
          barberia_id: string
          created_at: string
          enviada_at: string | null
          enviados: number
          estado: string
          id: string
          mensaje_html: string
          segmento: string
          titulo: string
        }
        Insert: {
          asunto: string
          barberia_id: string
          created_at?: string
          enviada_at?: string | null
          enviados?: number
          estado?: string
          id?: string
          mensaje_html: string
          segmento?: string
          titulo: string
        }
        Update: {
          asunto?: string
          barberia_id?: string
          created_at?: string
          enviada_at?: string | null
          enviados?: number
          estado?: string
          id?: string
          mensaje_html?: string
          segmento?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "campanas_barberia_id_fkey"
            columns: ["barberia_id"]
            isOneToOne: false
            referencedRelation: "barberias"
            referencedColumns: ["id"]
          },
        ]
      }
      disponibilidad: {
        Row: {
          barberia_id: string
          barbero_id: string
          created_at: string
          fecha: string
          id: string
          slots: Json
          updated_at: string
        }
        Insert: {
          barberia_id: string
          barbero_id: string
          created_at?: string
          fecha: string
          id?: string
          slots?: Json
          updated_at?: string
        }
        Update: {
          barberia_id?: string
          barbero_id?: string
          created_at?: string
          fecha?: string
          id?: string
          slots?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "disponibilidad_barberia_id_fkey"
            columns: ["barberia_id"]
            isOneToOne: false
            referencedRelation: "barberias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disponibilidad_barbero_id_fkey"
            columns: ["barbero_id"]
            isOneToOne: false
            referencedRelation: "barberos"
            referencedColumns: ["id"]
          },
        ]
      }
      notificaciones: {
        Row: {
          barberia_id: string
          created_at: string
          id: string
          leida: boolean
          mensaje: string
          metadata: Json | null
          tipo: string
          titulo: string
          usuario_id: string | null
        }
        Insert: {
          barberia_id: string
          created_at?: string
          id?: string
          leida?: boolean
          mensaje: string
          metadata?: Json | null
          tipo: string
          titulo: string
          usuario_id?: string | null
        }
        Update: {
          barberia_id?: string
          created_at?: string
          id?: string
          leida?: boolean
          mensaje?: string
          metadata?: Json | null
          tipo?: string
          titulo?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notificaciones_barberia_id_fkey"
            columns: ["barberia_id"]
            isOneToOne: false
            referencedRelation: "barberias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificaciones_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      reservas: {
        Row: {
          barberia_id: string
          barbero_id: string
          calificacion: number | null
          cliente_email: string | null
          cliente_id: string | null
          cliente_nombre: string | null
          created_at: string
          descuento: number
          estado: string
          fecha_hora: string
          id: string
          nota_cliente: string | null
          notas: string | null
          origen: string
          precio: number
          precio_final: number
          ref_code: string | null
          servicio_id: string
        }
        Insert: {
          barberia_id: string
          barbero_id: string
          calificacion?: number | null
          cliente_email?: string | null
          cliente_id?: string | null
          cliente_nombre?: string | null
          created_at?: string
          descuento?: number
          estado?: string
          fecha_hora: string
          id?: string
          nota_cliente?: string | null
          notas?: string | null
          origen?: string
          precio: number
          precio_final: number
          ref_code?: string | null
          servicio_id: string
        }
        Update: {
          barberia_id?: string
          barbero_id?: string
          calificacion?: number | null
          cliente_email?: string | null
          cliente_id?: string | null
          cliente_nombre?: string | null
          created_at?: string
          descuento?: number
          estado?: string
          fecha_hora?: string
          id?: string
          nota_cliente?: string | null
          notas?: string | null
          origen?: string
          precio?: number
          precio_final?: number
          ref_code?: string | null
          servicio_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservas_barberia_id_fkey"
            columns: ["barberia_id"]
            isOneToOne: false
            referencedRelation: "barberias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservas_barbero_id_fkey"
            columns: ["barbero_id"]
            isOneToOne: false
            referencedRelation: "barberos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservas_servicio_id_fkey"
            columns: ["servicio_id"]
            isOneToOne: false
            referencedRelation: "servicios"
            referencedColumns: ["id"]
          },
        ]
      }
      servicios: {
        Row: {
          activo: boolean
          barberia_id: string
          created_at: string
          descripcion: string | null
          duracion_min: number
          id: string
          nombre: string
          orden: number
          precio: number
        }
        Insert: {
          activo?: boolean
          barberia_id: string
          created_at?: string
          descripcion?: string | null
          duracion_min?: number
          id?: string
          nombre: string
          orden?: number
          precio: number
        }
        Update: {
          activo?: boolean
          barberia_id?: string
          created_at?: string
          descripcion?: string | null
          duracion_min?: number
          id?: string
          nombre?: string
          orden?: number
          precio?: number
        }
        Relationships: [
          {
            foreignKeyName: "servicios_barberia_id_fkey"
            columns: ["barberia_id"]
            isOneToOne: false
            referencedRelation: "barberias"
            referencedColumns: ["id"]
          },
        ]
      }
      suscripciones: {
        Row: {
          barberia_id: string
          cliente_email: string
          cliente_id: string | null
          cliente_nombre: string | null
          created_at: string
          estado: string
          flow_subscription_id: string | null
          id: string
          inicio_at: string
          plan: string
          precio: number
          vence_at: string | null
        }
        Insert: {
          barberia_id: string
          cliente_email: string
          cliente_id?: string | null
          cliente_nombre?: string | null
          created_at?: string
          estado?: string
          flow_subscription_id?: string | null
          id?: string
          inicio_at?: string
          plan?: string
          precio: number
          vence_at?: string | null
        }
        Update: {
          barberia_id?: string
          cliente_email?: string
          cliente_id?: string | null
          cliente_nombre?: string | null
          created_at?: string
          estado?: string
          flow_subscription_id?: string | null
          id?: string
          inicio_at?: string
          plan?: string
          precio?: number
          vence_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "suscripciones_barberia_id_fkey"
            columns: ["barberia_id"]
            isOneToOne: false
            referencedRelation: "barberias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suscripciones_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          activo: boolean
          barberia_id: string | null
          created_at: string
          fcm_token: string | null
          id: string
          nombre: string
          referral_by: string | null
          referral_code: string | null
          rol: string
          telefono: string | null
        }
        Insert: {
          activo?: boolean
          barberia_id?: string | null
          created_at?: string
          fcm_token?: string | null
          id: string
          nombre?: string
          referral_by?: string | null
          referral_code?: string | null
          rol?: string
          telefono?: string | null
        }
        Update: {
          activo?: boolean
          barberia_id?: string | null
          created_at?: string
          fcm_token?: string | null
          id?: string
          nombre?: string
          referral_by?: string | null
          referral_code?: string | null
          rol?: string
          telefono?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_barberia_id_fkey"
            columns: ["barberia_id"]
            isOneToOne: false
            referencedRelation: "barberias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_referral_by_fkey"
            columns: ["referral_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_my_barberia_id: { Args: never; Returns: string }
      get_my_rol: { Args: never; Returns: string }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
