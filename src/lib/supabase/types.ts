export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = 'accountmanager' | 'manager' | 'viewer';
export type ActionStatus = 'todo' | 'in-progress' | 'done';
export type PriceType = 'publication' | 'agreed';
export type PriceSource = 'seed' | 'manual' | 'proposal' | 'ai-lookup';
export type PricingConfigType = 'platform+module' | 'package-bundle' | 'tiered-license' | 'flat';
export type ProposalStatus = 'open' | 'approved' | 'rejected';
export type AuditAction = 'created' | 'updated' | 'approved' | 'rejected' | 'seeded';
export type AuditEntityType = 'publication_price' | 'pricing_config' | 'price_proposal';

export interface Database {
  public: {
    Tables: {
      teams: {
        Row: {
          id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: UserRole;
          region: string;
          team_id: string;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name?: string;
          role?: UserRole;
          region?: string;
          team_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          role?: UserRole;
          region?: string;
          team_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      schools: {
        Row: {
          id: string;
          slug: string;
          name: string;
          team_id: string;
          owner_id: string;
          is_complete: boolean;
          completed_steps: number[];
          levels: string[];
          student_counts: Json;
          selected_modules: string[];
          module_setups: Json;
          scenario: string | null;
          migration_hourly_rate: number;
          migration_time_saving_overrides: Json;
          switching_costs: number;
          pipeline_status: string;
          lost_deal_info: Json | null;
          region: string;
          tags: string[];
          view_preference: string;
          created_by: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          team_id: string;
          owner_id: string;
          is_complete?: boolean;
          completed_steps?: number[];
          levels?: string[];
          student_counts?: Json;
          selected_modules?: string[];
          module_setups?: Json;
          scenario?: string | null;
          migration_hourly_rate?: number;
          migration_time_saving_overrides?: Json;
          switching_costs?: number;
          pipeline_status?: string;
          lost_deal_info?: Json | null;
          region?: string;
          tags?: string[];
          view_preference?: string;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          team_id?: string;
          owner_id?: string;
          is_complete?: boolean;
          completed_steps?: number[];
          levels?: string[];
          student_counts?: Json;
          selected_modules?: string[];
          module_setups?: Json;
          scenario?: string | null;
          migration_hourly_rate?: number;
          migration_time_saving_overrides?: Json;
          switching_costs?: number;
          pipeline_status?: string;
          lost_deal_info?: Json | null;
          region?: string;
          tags?: string[];
          view_preference?: string;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      contacts: {
        Row: {
          id: string;
          school_id: string;
          name: string;
          dmu_position: string;
          job_title: string;
          email: string;
          phone: string;
          preferred_channel: string;
          authority: string;
          last_contact_date: string | null;
          notes: string;
          is_primary: boolean;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          school_id: string;
          name: string;
          dmu_position: string;
          job_title?: string;
          email?: string;
          phone?: string;
          preferred_channel?: string;
          authority?: string;
          last_contact_date?: string | null;
          notes?: string;
          is_primary?: boolean;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          school_id?: string;
          name?: string;
          dmu_position?: string;
          job_title?: string;
          email?: string;
          phone?: string;
          preferred_channel?: string;
          authority?: string;
          last_contact_date?: string | null;
          notes?: string;
          is_primary?: boolean;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      conversations: {
        Row: {
          id: string;
          school_id: string;
          date: string;
          contact_id: string | null;
          content: string;
          tags: string[];
          created_by: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          school_id: string;
          date: string;
          contact_id?: string | null;
          content: string;
          tags?: string[];
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          school_id?: string;
          date?: string;
          contact_id?: string | null;
          content?: string;
          tags?: string[];
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      actions: {
        Row: {
          id: string;
          school_id: string;
          title: string;
          status: string;
          conversation_id: string | null;
          created_by: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          school_id: string;
          title: string;
          status?: string;
          conversation_id?: string | null;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          school_id?: string;
          title?: string;
          status?: string;
          conversation_id?: string | null;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      system_events: {
        Row: {
          id: string;
          school_id: string;
          timestamp: string;
          event_type: string;
          description: string;
          metadata: Json | null;
          user_id: string | null;
        };
        Insert: {
          id?: string;
          school_id: string;
          timestamp?: string;
          event_type: string;
          description: string;
          metadata?: Json | null;
          user_id?: string | null;
        };
        Update: {
          id?: string;
          school_id?: string;
          timestamp?: string;
          event_type?: string;
          description?: string;
          metadata?: Json | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      schoolplan_analyses: {
        Row: {
          id: string;
          school_id: string;
          file_name: string;
          file_path: string;
          page_count: number | null;
          uploaded_at: string;
          summary: string;
          themes: Json;
          opportunities: Json;
          also_relevant: Json;
          opportunity_annotations: Json;
          analysis_status: string;
          error_message: string | null;
          created_by: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          school_id: string;
          file_name: string;
          file_path: string;
          page_count?: number | null;
          uploaded_at?: string;
          summary?: string;
          themes?: Json;
          opportunities?: Json;
          also_relevant?: Json;
          opportunity_annotations?: Json;
          analysis_status?: string;
          error_message?: string | null;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          school_id?: string;
          file_name?: string;
          file_path?: string;
          page_count?: number | null;
          uploaded_at?: string;
          summary?: string;
          themes?: Json;
          opportunities?: Json;
          also_relevant?: Json;
          opportunity_annotations?: Json;
          analysis_status?: string;
          error_message?: string | null;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      price_audit_log: {
        Row: {
          id: string;
          team_id: string;
          entity_type: AuditEntityType;
          entity_id: string;
          action: AuditAction;
          old_value: Json | null;
          new_value: Json | null;
          reason: string | null;
          proposal_id: string | null;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          entity_type: AuditEntityType;
          entity_id: string;
          action: AuditAction;
          old_value?: Json | null;
          new_value?: Json | null;
          reason?: string | null;
          proposal_id?: string | null;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          team_id?: string;
          entity_type?: AuditEntityType;
          entity_id?: string;
          action?: AuditAction;
          old_value?: Json | null;
          new_value?: Json | null;
          reason?: string | null;
          proposal_id?: string | null;
          user_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      price_proposals: {
        Row: {
          id: string;
          team_id: string;
          module_id: string;
          provider: string;
          current_price: number;
          proposed_price: number;
          source: string;
          explanation: string;
          evidence_path: string | null;
          status: ProposalStatus;
          rejection_reason: string | null;
          submitted_by: string;
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          module_id: string;
          provider: string;
          current_price: number;
          proposed_price: number;
          source: string;
          explanation: string;
          evidence_path?: string | null;
          status?: ProposalStatus;
          rejection_reason?: string | null;
          submitted_by: string;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          team_id?: string;
          module_id?: string;
          provider?: string;
          current_price?: number;
          proposed_price?: number;
          source?: string;
          explanation?: string;
          evidence_path?: string | null;
          status?: ProposalStatus;
          rejection_reason?: string | null;
          submitted_by?: string;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      pricing_configs: {
        Row: {
          id: string;
          team_id: string;
          provider: string;
          config_type: PricingConfigType;
          config_data: Json;
          version: number;
          is_active: boolean;
          created_by: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          provider: string;
          config_type: PricingConfigType;
          config_data: Json;
          version?: number;
          is_active?: boolean;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          team_id?: string;
          provider?: string;
          config_type?: PricingConfigType;
          config_data?: Json;
          version?: number;
          is_active?: boolean;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      publication_prices: {
        Row: {
          id: string;
          team_id: string;
          module_id: string;
          provider: string;
          amount_per_student: number;
          source: PriceSource;
          source_label: string;
          verified_at: string;
          is_active: boolean;
          note: string | null;
          created_by: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          module_id: string;
          provider: string;
          amount_per_student: number;
          source?: PriceSource;
          source_label?: string;
          verified_at?: string;
          is_active?: boolean;
          note?: string | null;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          team_id?: string;
          module_id?: string;
          provider?: string;
          amount_per_student?: number;
          source?: PriceSource;
          source_label?: string;
          verified_at?: string;
          is_active?: boolean;
          note?: string | null;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      planned_touchpoints: {
        Row: {
          id: string;
          school_id: string;
          contact_id: string;
          school_year_start: number;
          month_index: number;
          note: string;
          status: string;
          created_by: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          school_id: string;
          contact_id: string;
          school_year_start: number;
          month_index: number;
          note?: string;
          status?: string;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          school_id?: string;
          contact_id?: string;
          school_year_start?: number;
          month_index?: number;
          note?: string;
          status?: string;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      school_prices: {
        Row: {
          id: string;
          school_id: string;
          module_id: string;
          provider: string;
          amount: number;
          price_type: string;
          discount_percentage: number;
          source: string;
          verified_at: string | null;
          note: string;
          is_active: boolean;
          activation_reason: string | null;
          activated_at: string | null;
          created_by: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          school_id: string;
          module_id: string;
          provider: string;
          amount: number;
          price_type: string;
          discount_percentage?: number;
          source?: string;
          verified_at?: string | null;
          note?: string;
          is_active?: boolean;
          activation_reason?: string | null;
          activated_at?: string | null;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          school_id?: string;
          module_id?: string;
          provider?: string;
          amount?: number;
          price_type?: string;
          discount_percentage?: number;
          source?: string;
          verified_at?: string | null;
          note?: string;
          is_active?: boolean;
          activation_reason?: string | null;
          activated_at?: string | null;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_user_team_id: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      get_user_role: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
    };
    Enums: {
      user_role: UserRole;
      action_status: ActionStatus;
      price_type: PriceType;
      price_source: PriceSource;
      pricing_config_type: PricingConfigType;
      proposal_status: ProposalStatus;
      audit_action: AuditAction;
      audit_entity_type: AuditEntityType;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];
