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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      booking_rate_limits: {
        Row: {
          attempts: number
          ip_hash: string
          updated_at: string
          window_started_at: string
        }
        Insert: {
          attempts?: number
          ip_hash: string
          updated_at?: string
          window_started_at?: string
        }
        Update: {
          attempts?: number
          ip_hash?: string
          updated_at?: string
          window_started_at?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          booking_reference: string
          created_at: string
          customer_email: string
          customer_message: string
          customer_name: string
          customer_phone: string
          id: string
          notification_attempts: number
          preferred_date: string
          preferred_time: string
          service_name: string
          status: string
          timezone: string
          updated_at: string
          whatsapp_error: string | null
          whatsapp_sent_at: string | null
          whatsapp_status: string
        }
        Insert: {
          booking_reference: string
          created_at?: string
          customer_email: string
          customer_message?: string
          customer_name: string
          customer_phone: string
          id?: string
          notification_attempts?: number
          preferred_date: string
          preferred_time: string
          service_name: string
          status?: string
          timezone?: string
          updated_at?: string
          whatsapp_error?: string | null
          whatsapp_sent_at?: string | null
          whatsapp_status?: string
        }
        Update: {
          booking_reference?: string
          created_at?: string
          customer_email?: string
          customer_message?: string
          customer_name?: string
          customer_phone?: string
          id?: string
          notification_attempts?: number
          preferred_date?: string
          preferred_time?: string
          service_name?: string
          status?: string
          timezone?: string
          updated_at?: string
          whatsapp_error?: string | null
          whatsapp_sent_at?: string | null
          whatsapp_status?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_outbound_messages: {
        Row: {
          booking_id: string
          created_at: string
          delivery_errors: Json
          delivery_status: string | null
          id: string
          provider_timestamp: string | null
          recipient_phone: string
          send_error: Json | null
          send_response: Json | null
          send_status: string
          updated_at: string
          whatsapp_message_id: string | null
        }
        Insert: {
          booking_id: string
          created_at?: string
          delivery_errors?: Json
          delivery_status?: string | null
          id?: string
          provider_timestamp?: string | null
          recipient_phone: string
          send_error?: Json | null
          send_response?: Json | null
          send_status: string
          updated_at?: string
          whatsapp_message_id?: string | null
        }
        Update: {
          booking_id?: string
          created_at?: string
          delivery_errors?: Json
          delivery_status?: string | null
          id?: string
          provider_timestamp?: string | null
          recipient_phone?: string
          send_error?: Json | null
          send_response?: Json | null
          send_status?: string
          updated_at?: string
          whatsapp_message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_outbound_messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_webhook_events: {
        Row: {
          delivery_id: string
          event: string
          id: string
          payload: Json
          processed_at: string | null
          processing_error: string | null
          received_at: string
        }
        Insert: {
          delivery_id: string
          event: string
          id?: string
          payload: Json
          processed_at?: string | null
          processing_error?: string | null
          received_at?: string
        }
        Update: {
          delivery_id?: string
          event?: string
          id?: string
          payload?: Json
          processed_at?: string | null
          processing_error?: string | null
          received_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_booking_request: {
        Args: {
          p_customer_email: string
          p_customer_message: string
          p_customer_name: string
          p_customer_phone: string
          p_ip_hash: string
          p_preferred_date: string
          p_preferred_time: string
          p_service_name: string
        }
        Returns: {
          booking_reference: string
          customer_name: string
          id: string
          preferred_date: string
          preferred_time: string
          service_name: string
          status: string
        }[]
      }
      has_admin_role: { Args: never; Returns: boolean }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
