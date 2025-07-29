export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      awarded_user: {
        Row: {
          awarded_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          awarded_at?: string | null
          id?: string
          user_id?: string
        }
        Update: {
          awarded_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      comment_likes: {
        Row: {
          comment_id: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          parent_id: string | null
          post_id: number
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          parent_id?: string | null
          post_id: number
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          parent_id?: string | null
          post_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_purchases: {
        Row: {
          amount: number | null
          created_at: string
          id: string
          user: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string
          id?: string
          user?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string
          id?: string
          user?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "credit_purchases_user_fkey"
            columns: ["user"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string
          followee_id: string | null
          follower_id: string | null
          id: number
        }
        Insert: {
          created_at?: string
          followee_id?: string | null
          follower_id?: string | null
          id?: number
        }
        Update: {
          created_at?: string
          followee_id?: string | null
          follower_id?: string | null
          id?: number
        }
        Relationships: [
          {
            foreignKeyName: "follows_followee_id_fkey"
            columns: ["followee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      likes: {
        Row: {
          author: string | null
          created_at: string
          id: number
          post_author: string | null
          post_id: number | null
        }
        Insert: {
          author?: string | null
          created_at?: string
          id?: number
          post_author?: string | null
          post_id?: number | null
        }
        Update: {
          author?: string | null
          created_at?: string
          id?: number
          post_author?: string | null
          post_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "likes_author_fkey"
            columns: ["author"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts_with_mint_count"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts_with_rank"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean
          post_id: number | null
          sender_id: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean
          post_id?: number | null
          sender_id: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean
          post_id?: number | null
          sender_id?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts_with_mint_count"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts_with_rank"
            referencedColumns: ["id"]
          },
        ]
      }
      post_mints: {
        Row: {
          chain_id: number
          created_at: string | null
          id: number
          post_id: number | null
          transaction_hash: string
          user_id: string | null
        }
        Insert: {
          chain_id: number
          created_at?: string | null
          id?: never
          post_id?: number | null
          transaction_hash: string
          user_id?: string | null
        }
        Update: {
          chain_id?: number
          created_at?: string | null
          id?: never
          post_id?: number | null
          transaction_hash?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "post_mints_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_mints_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts_with_mint_count"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_mints_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts_with_rank"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_mints_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_pins: {
        Row: {
          createdAt: string | null
          id: number
          pinned_at: string | null
          post_id: number | null
          user_id: string | null
        }
        Insert: {
          createdAt?: string | null
          id?: never
          pinned_at?: string | null
          post_id?: number | null
          user_id?: string | null
        }
        Update: {
          createdAt?: string | null
          id?: never
          pinned_at?: string | null
          post_id?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "post_pins_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_pins_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts_with_mint_count"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_pins_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts_with_rank"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author: string
          caption: string | null
          category: string | null
          cpu: number | null
          createdAt: string
          device: string | null
          id: number
          ipfsImages: Json | null
          isDraft: boolean | null
          isPinned: boolean | null
          isPrivate: boolean | null
          jobId: string | null
          like_count: number | null
          media_type: string | null
          n: number | null
          prompt: string | null
          seed: number | null
          video_data: Json | null
        }
        Insert: {
          author?: string
          caption?: string | null
          category?: string | null
          cpu?: number | null
          createdAt?: string
          device?: string | null
          id?: number
          ipfsImages?: Json | null
          isDraft?: boolean | null
          isPinned?: boolean | null
          isPrivate?: boolean | null
          jobId?: string | null
          like_count?: number | null
          media_type?: string | null
          n?: number | null
          prompt?: string | null
          seed?: number | null
          video_data?: Json | null
        }
        Update: {
          author?: string
          caption?: string | null
          category?: string | null
          cpu?: number | null
          createdAt?: string
          device?: string | null
          id?: number
          ipfsImages?: Json | null
          isDraft?: boolean | null
          isPinned?: boolean | null
          isPrivate?: boolean | null
          jobId?: string | null
          like_count?: number | null
          media_type?: string | null
          n?: number | null
          prompt?: string | null
          seed?: number | null
          video_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "Posts_author_fkey"
            columns: ["author"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          createdAt: string
          credit_balance: number
          display_name: string | null
          email: string | null
          follower_count: number
          following_count: number
          full_name: string | null
          id: string
          likes_received: number
          location: string | null
          search_vector: unknown | null
          torus_id: string | null
          updated_at: string | null
          wallet: Json | null
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          createdAt?: string
          credit_balance: number
          display_name?: string | null
          email?: string | null
          follower_count?: number
          following_count?: number
          full_name?: string | null
          id: string
          likes_received?: number
          location?: string | null
          search_vector?: unknown | null
          torus_id?: string | null
          updated_at?: string | null
          wallet?: Json | null
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          createdAt?: string
          credit_balance?: number
          display_name?: string | null
          email?: string | null
          follower_count?: number
          following_count?: number
          full_name?: string | null
          id?: string
          likes_received?: number
          location?: string | null
          search_vector?: unknown | null
          torus_id?: string | null
          updated_at?: string | null
          wallet?: Json | null
          website?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      posts_with_mint_count: {
        Row: {
          author: string | null
          caption: string | null
          category: string | null
          cpu: number | null
          createdAt: string | null
          device: string | null
          id: number | null
          ipfsImages: Json | null
          isDraft: boolean | null
          isPinned: boolean | null
          isPrivate: boolean | null
          like_count: number | null
          media_type: string | null
          mint_count: number | null
          n: number | null
          prompt: string | null
          seed: number | null
        }
        Relationships: [
          {
            foreignKeyName: "Posts_author_fkey"
            columns: ["author"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      posts_with_rank: {
        Row: {
          author: string | null
          caption: string | null
          category: string | null
          cpu: number | null
          createdAt: string | null
          device: string | null
          id: number | null
          ipfsImages: Json | null
          isDraft: boolean | null
          isPinned: boolean | null
          isPrivate: boolean | null
          like_count: number | null
          media_type: string | null
          n: number | null
          prompt: string | null
          rank: number | null
          seed: number | null
          video_data: Json | null
        }
        Insert: {
          author?: string | null
          caption?: string | null
          category?: string | null
          cpu?: number | null
          createdAt?: string | null
          device?: string | null
          id?: number | null
          ipfsImages?: Json | null
          isDraft?: boolean | null
          isPinned?: boolean | null
          isPrivate?: boolean | null
          like_count?: number | null
          media_type?: string | null
          n?: number | null
          prompt?: string | null
          rank?: never
          seed?: number | null
          video_data?: Json | null
        }
        Update: {
          author?: string | null
          caption?: string | null
          category?: string | null
          cpu?: number | null
          createdAt?: string | null
          device?: string | null
          id?: number | null
          ipfsImages?: Json | null
          isDraft?: boolean | null
          isPinned?: boolean | null
          isPrivate?: boolean | null
          like_count?: number | null
          media_type?: string | null
          n?: number | null
          prompt?: string | null
          rank?: never
          seed?: number | null
          video_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "Posts_author_fkey"
            columns: ["author"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      delete_from_queue: {
        Args: { queue_name: string; msg_id: number }
        Returns: undefined
      }
      get_comments_with_likes: {
        Args: { post_uuid: number; current_user_id: string }
        Returns: {
          id: string
          post_id: number
          user_id: string
          content: string
          parent_id: string
          created_at: string
          username: string
          avatar_url: string
          like_count: number
          user_liked: boolean
        }[]
      }
      get_comments_with_users: {
        Args: { _post_id: number } | { post_uuid: string }
        Returns: {
          id: string
          post_id: string
          user_id: string
          content: string
          parent_id: string
          created_at: string
          username: string
          avatar_url: string
        }[]
      }
      get_replies_with_likes: {
        Args: { given_parent_id: string; current_user_id: string }
        Returns: {
          id: string
          post_id: number
          user_id: string
          content: string
          parent_id: string
          created_at: string
          username: string
          avatar_url: string
          like_count: number
          user_liked: boolean
        }[]
      }
      read_from_queue: {
        Args: { queue_name: string; vt: number; qty: number }
        Returns: {
          msg_id: number
          message: Json
          enqueued_at: string
        }[]
      }
      search_posts: {
        Args: { keyword: string; limit_num: number; offset_num: number }
        Returns: {
          rank: number
          id: string
          prompt: string
          ipfsimages: Json
          created_at: string
          author_id: string
          other_columns: string
        }[]
      }
      send_to_queue: {
        Args: { queue_name: string; msg: Json; delay?: number }
        Returns: undefined
      }
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
