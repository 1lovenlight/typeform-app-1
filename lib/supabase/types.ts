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
    PostgrestVersion: "13.0.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      activities: {
        Row: {
          activity_image_url: string | null
          activity_type: string | null
          agent_id: string | null
          avatar_image_url: string | null
          avatar_name: string | null
          category: string | null
          character_id: string | null
          config: Json | null
          content: string | null
          created_at: string
          difficulty: string | null
          display_name: string
          embed_id: string | null
          fail_video_url: string | null
          form_id: string | null
          hint: boolean | null
          id: string
          internal_name: string
          is_quiz: boolean
          loop_type: string | null
          module_id: string | null
          order_index: number | null
          pass_video_url: string | null
          published: boolean | null
          roleplay_config: Json | null
          rubric_prompt: string | null
          short_description: string | null
          topic_id: string | null
          updated_at: string
        }
        Insert: {
          activity_image_url?: string | null
          activity_type?: string | null
          agent_id?: string | null
          avatar_image_url?: string | null
          avatar_name?: string | null
          category?: string | null
          character_id?: string | null
          config?: Json | null
          content?: string | null
          created_at?: string
          difficulty?: string | null
          display_name: string
          embed_id?: string | null
          fail_video_url?: string | null
          form_id?: string | null
          hint?: boolean | null
          id?: string
          internal_name: string
          is_quiz?: boolean
          loop_type?: string | null
          module_id?: string | null
          order_index?: number | null
          pass_video_url?: string | null
          published?: boolean | null
          roleplay_config?: Json | null
          rubric_prompt?: string | null
          short_description?: string | null
          topic_id?: string | null
          updated_at?: string
        }
        Update: {
          activity_image_url?: string | null
          activity_type?: string | null
          agent_id?: string | null
          avatar_image_url?: string | null
          avatar_name?: string | null
          category?: string | null
          character_id?: string | null
          config?: Json | null
          content?: string | null
          created_at?: string
          difficulty?: string | null
          display_name?: string
          embed_id?: string | null
          fail_video_url?: string | null
          form_id?: string | null
          hint?: boolean | null
          id?: string
          internal_name?: string
          is_quiz?: boolean
          loop_type?: string | null
          module_id?: string | null
          order_index?: number | null
          pass_video_url?: string | null
          published?: boolean | null
          roleplay_config?: Json | null
          rubric_prompt?: string | null
          short_description?: string | null
          topic_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "curriculum_hierarchy"
            referencedColumns: ["module_id"]
          },
          {
            foreignKeyName: "activities_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_eligibility: {
        Row: {
          activity_id: string
          created_at: string | null
          id: string
          prerequisite_activity_id: string | null
          prerequisite_score_threshold: number | null
        }
        Insert: {
          activity_id: string
          created_at?: string | null
          id?: string
          prerequisite_activity_id?: string | null
          prerequisite_score_threshold?: number | null
        }
        Update: {
          activity_id?: string
          created_at?: string | null
          id?: string
          prerequisite_activity_id?: string | null
          prerequisite_score_threshold?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_eligibility_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_eligibility_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activity_summaries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_eligibility_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "curriculum_hierarchy"
            referencedColumns: ["activity_id"]
          },
          {
            foreignKeyName: "activity_eligibility_prerequisite_activity_id_fkey"
            columns: ["prerequisite_activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_eligibility_prerequisite_activity_id_fkey"
            columns: ["prerequisite_activity_id"]
            isOneToOne: false
            referencedRelation: "activity_summaries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_eligibility_prerequisite_activity_id_fkey"
            columns: ["prerequisite_activity_id"]
            isOneToOne: false
            referencedRelation: "curriculum_hierarchy"
            referencedColumns: ["activity_id"]
          },
        ]
      }
      activity_responses: {
        Row: {
          activity_id: string | null
          created_at: string
          form_title: string | null
          form_type: string | null
          id: number
          max_score: number | null
          quiz_score: number | null
          response: Json | null
          token: string | null
          user_id: string | null
        }
        Insert: {
          activity_id?: string | null
          created_at?: string
          form_title?: string | null
          form_type?: string | null
          id?: number
          max_score?: number | null
          quiz_score?: number | null
          response?: Json | null
          token?: string | null
          user_id?: string | null
        }
        Update: {
          activity_id?: string | null
          created_at?: string
          form_title?: string | null
          form_type?: string | null
          id?: number
          max_score?: number | null
          quiz_score?: number | null
          response?: Json | null
          token?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_responses_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_responses_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activity_summaries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_responses_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "curriculum_hierarchy"
            referencedColumns: ["activity_id"]
          },
        ]
      }
      characters: {
        Row: {
          age: number | null
          changes_already_made: string[] | null
          character_name: string
          character_slug: string
          characteristic_phrases: Json
          client_presentation_style: string | null
          coach_facing_blurb: string
          communication_style: Json
          created_at: string | null
          created_by: string | null
          critical_issues: Json
          current_emotional_state: string | null
          difficulty_label: string | null
          difficulty_rating: number
          gender: string | null
          id: string
          is_active: boolean | null
          is_published: boolean | null
          key_coaching_challenges: string[] | null
          key_topics: Json
          occupation: string | null
          personality_traits: string[] | null
          primary_issues: string[]
          profile_image_url: string | null
          pronouns: string | null
          recent_trigger_event: string
          relationship_history: Json
          relationship_status: string | null
          sample_opening_statements: string[] | null
          tags: string[]
          updated_at: string | null
          version: number | null
          what_character_knows: Json
          what_character_wants: Json
        }
        Insert: {
          age?: number | null
          changes_already_made?: string[] | null
          character_name: string
          character_slug: string
          characteristic_phrases?: Json
          client_presentation_style?: string | null
          coach_facing_blurb: string
          communication_style?: Json
          created_at?: string | null
          created_by?: string | null
          critical_issues?: Json
          current_emotional_state?: string | null
          difficulty_label?: string | null
          difficulty_rating: number
          gender?: string | null
          id?: string
          is_active?: boolean | null
          is_published?: boolean | null
          key_coaching_challenges?: string[] | null
          key_topics?: Json
          occupation?: string | null
          personality_traits?: string[] | null
          primary_issues?: string[]
          profile_image_url?: string | null
          pronouns?: string | null
          recent_trigger_event: string
          relationship_history?: Json
          relationship_status?: string | null
          sample_opening_statements?: string[] | null
          tags?: string[]
          updated_at?: string | null
          version?: number | null
          what_character_knows?: Json
          what_character_wants?: Json
        }
        Update: {
          age?: number | null
          changes_already_made?: string[] | null
          character_name?: string
          character_slug?: string
          characteristic_phrases?: Json
          client_presentation_style?: string | null
          coach_facing_blurb?: string
          communication_style?: Json
          created_at?: string | null
          created_by?: string | null
          critical_issues?: Json
          current_emotional_state?: string | null
          difficulty_label?: string | null
          difficulty_rating?: number
          gender?: string | null
          id?: string
          is_active?: boolean | null
          is_published?: boolean | null
          key_coaching_challenges?: string[] | null
          key_topics?: Json
          occupation?: string | null
          personality_traits?: string[] | null
          primary_issues?: string[]
          profile_image_url?: string | null
          pronouns?: string | null
          recent_trigger_event?: string
          relationship_history?: Json
          relationship_status?: string | null
          sample_opening_statements?: string[] | null
          tags?: string[]
          updated_at?: string | null
          version?: number | null
          what_character_knows?: Json
          what_character_wants?: Json
        }
        Relationships: []
      }
      course_progress: {
        Row: {
          course_id: string
          created_at: string | null
          current_subject_index: number | null
          id: string
          last_activity_at: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          course_id: string
          created_at?: string | null
          current_subject_index?: number | null
          id?: string
          last_activity_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          course_id?: string
          created_at?: string | null
          current_subject_index?: number | null
          id?: string
          last_activity_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "curriculum_hierarchy"
            referencedColumns: ["course_id"]
          },
        ]
      }
      courses: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_published: boolean | null
          order_index: number | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean | null
          order_index?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean | null
          order_index?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      module_progress: {
        Row: {
          completed_count: number | null
          created_at: string | null
          current_activity_index: number | null
          id: string
          last_activity_at: string | null
          module_id: string
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_count?: number | null
          created_at?: string | null
          current_activity_index?: number | null
          id?: string
          last_activity_at?: string | null
          module_id: string
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_count?: number | null
          created_at?: string | null
          current_activity_index?: number | null
          id?: string
          last_activity_at?: string | null
          module_id?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "module_progress_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "curriculum_hierarchy"
            referencedColumns: ["module_id"]
          },
          {
            foreignKeyName: "module_progress_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          avatar_image: string | null
          course_id: string
          course_image: string | null
          created_at: string
          description: string | null
          id: string
          order_index: number | null
          title: string
          updated_at: string
        }
        Insert: {
          avatar_image?: string | null
          course_id: string
          course_image?: string | null
          created_at?: string
          description?: string | null
          id?: string
          order_index?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          avatar_image?: string | null
          course_id?: string
          course_image?: string | null
          created_at?: string
          description?: string | null
          id?: string
          order_index?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subjects_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subjects_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "curriculum_hierarchy"
            referencedColumns: ["course_id"]
          },
        ]
      }
      practice_sessions: {
        Row: {
          accepted_time_unix_secs: number | null
          activity_id: string | null
          agent_id: string | null
          call_data: Json | null
          call_duration_secs: number | null
          call_successful: string | null
          call_summary_title: string | null
          character_id: string | null
          character_name: string | null
          conversation_id: string | null
          cost_cents: number | null
          created_at: string
          did_coach_participate: boolean | null
          id: string
          scoring_status: string | null
          start_time_unix_secs: number | null
          termination_reason: string | null
          transcript: Json | null
          transcript_summary: string | null
          user_id: string
        }
        Insert: {
          accepted_time_unix_secs?: number | null
          activity_id?: string | null
          agent_id?: string | null
          call_data?: Json | null
          call_duration_secs?: number | null
          call_successful?: string | null
          call_summary_title?: string | null
          character_id?: string | null
          character_name?: string | null
          conversation_id?: string | null
          cost_cents?: number | null
          created_at?: string
          did_coach_participate?: boolean | null
          id?: string
          scoring_status?: string | null
          start_time_unix_secs?: number | null
          termination_reason?: string | null
          transcript?: Json | null
          transcript_summary?: string | null
          user_id: string
        }
        Update: {
          accepted_time_unix_secs?: number | null
          activity_id?: string | null
          agent_id?: string | null
          call_data?: Json | null
          call_duration_secs?: number | null
          call_successful?: string | null
          call_summary_title?: string | null
          character_id?: string | null
          character_name?: string | null
          conversation_id?: string | null
          cost_cents?: number | null
          created_at?: string
          did_coach_participate?: boolean | null
          id?: string
          scoring_status?: string | null
          start_time_unix_secs?: number | null
          termination_reason?: string | null
          transcript?: Json | null
          transcript_summary?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "practice_sessions_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "practice_sessions_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activity_summaries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "practice_sessions_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "curriculum_hierarchy"
            referencedColumns: ["activity_id"]
          },
          {
            foreignKeyName: "practice_sessions_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      prompts: {
        Row: {
          created_at: string | null
          id: string
          label: string
          order: number
          template: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          label: string
          order?: number
          template: string
        }
        Update: {
          created_at?: string | null
          id?: string
          label?: string
          order?: number
          template?: string
        }
        Relationships: []
      }
      scorecards: {
        Row: {
          activity_id: string | null
          created_at: string
          criteria_scores: Json
          feedback: string
          id: string
          overall_score: number
          session_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          activity_id?: string | null
          created_at?: string
          criteria_scores?: Json
          feedback: string
          id?: string
          overall_score: number
          session_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          activity_id?: string | null
          created_at?: string
          criteria_scores?: Json
          feedback?: string
          id?: string
          overall_score?: number
          session_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scorecards_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scorecards_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activity_summaries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scorecards_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "curriculum_hierarchy"
            referencedColumns: ["activity_id"]
          },
          {
            foreignKeyName: "scorecards_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: true
            referencedRelation: "practice_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      topics: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          module_id: string
          order_index: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          module_id: string
          order_index?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          module_id?: string
          order_index?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "topics_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "curriculum_hierarchy"
            referencedColumns: ["module_id"]
          },
          {
            foreignKeyName: "topics_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      user_onboarding: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          dismissed: boolean | null
          dismissed_at: string | null
          id: string
          step: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          dismissed?: boolean | null
          dismissed_at?: string | null
          id?: string
          step: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          dismissed?: boolean | null
          dismissed_at?: string | null
          id?: string
          step?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_progress: {
        Row: {
          activity_id: string
          completed_at: string
          id: string
          user_id: string
        }
        Insert: {
          activity_id: string
          completed_at?: string
          id?: string
          user_id: string
        }
        Update: {
          activity_id?: string
          completed_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_progress_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_progress_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activity_summaries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_progress_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "curriculum_hierarchy"
            referencedColumns: ["activity_id"]
          },
        ]
      }
    }
    Views: {
      activity_summaries: {
        Row: {
          activity_type: string | null
          course_id: string | null
          course_title: string | null
          difficulty: string | null
          display_name: string | null
          id: string | null
          internal_name: string | null
          is_quiz: boolean | null
          loop_type: string | null
          module_id: string | null
          module_title: string | null
          order_index: number | null
          short_description: string | null
          topic_id: string | null
          topic_title: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activities_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "curriculum_hierarchy"
            referencedColumns: ["module_id"]
          },
          {
            foreignKeyName: "activities_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subjects_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subjects_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "curriculum_hierarchy"
            referencedColumns: ["course_id"]
          },
        ]
      }
      curriculum_hierarchy: {
        Row: {
          activity_description: string | null
          activity_id: string | null
          activity_image_url: string | null
          activity_internal_name: string | null
          activity_name: string | null
          activity_order: number | null
          activity_published: boolean | null
          activity_type: string | null
          avatar_image_url: string | null
          avatar_name: string | null
          course_description: string | null
          course_id: string | null
          course_order: number | null
          course_published: boolean | null
          course_title: string | null
          difficulty: string | null
          is_quiz: boolean | null
          loop_type: string | null
          module_description: string | null
          module_id: string | null
          module_order: number | null
          module_title: string | null
        }
        Relationships: []
      }
      onboarding_analytics: {
        Row: {
          completed_count: number | null
          completion_rate: number | null
          dismissal_rate: number | null
          dismissed_count: number | null
          step: string | null
          total_users: number | null
        }
        Relationships: []
      }
      scorecards_with_activity: {
        Row: {
          activity_description: string | null
          activity_difficulty: string | null
          activity_id: string | null
          activity_internal_name: string | null
          activity_name: string | null
          character_id: string | null
          created_at: string | null
          criteria_scores: Json | null
          feedback: string | null
          id: string | null
          overall_score: number | null
          session_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activities_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scorecards_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scorecards_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activity_summaries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scorecards_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "curriculum_hierarchy"
            referencedColumns: ["activity_id"]
          },
          {
            foreignKeyName: "scorecards_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: true
            referencedRelation: "practice_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      sync_activity_responses_to_progress: { Args: never; Returns: undefined }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
