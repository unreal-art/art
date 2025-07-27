import { User as SupabaseUser } from "@supabase/supabase-js"

export type UploadResponse = {
  name: string
  hash: string
  size: string
  fileNames: string[]
}

export type Post = {
  author: string
  category: string | null
  cpu: number | null
  createdAt: string
  device: string | null
  id: number
  ipfsImages: UploadResponse[] | null
  isPinned: boolean | null
  isPrivate: boolean | null
  isDraft: boolean | null
  like_count: number | null
  n: number | null
  prompt: string | null
  seed: number | null
  caption: string | null
  media_type: string | null
  video_data: any | null
}

export interface JobSpec extends Post {
  module?: string
  version?: string //version
  inputs?: Record<string, string | number>
}

// Define proper types for pages
export interface Page {
  data: Post[]
  nextCursor?: number
}

export interface FollowStats {
  followerCount: number
  followeeCount: number
}

export interface Like {
  id: number
  author: string | null
  created_at: string
  post_id: number | null
}

export interface Notification {
  id: string | null // UUID
  user_id: string | null // UUID of the user receiving the notification
  sender_id: string | null // UUID of the sender
  post_id: number | null // bigint (assuming it's stored as a number in JavaScript)
  type: string
  is_read: boolean
  created_at: string | null // ISO timestamp
}

type WalletObject = {
  address: string
  privateKey: string
  publicKey: string
}

export type ExtendedUser = SupabaseUser & {
  // is_anonymous: boolean;

  wallet?: WalletObject
  bio: string
  location: string
  full_name: string
  username: string | null
  avatar_url: string
  creditBalance: number
  torus_id?: string
}

export interface CommentWithUser {
  id: string // UUID
  post_id: number // BIGINT
  user_id: string // UUID
  content: string
  parent_id: string | null // UUID or null
  created_at: string // ISO timestamp
  username: string | null
  avatar_url: string
  like_count: number // Number of likes
  user_liked: boolean // Whether the current user liked the comment
}
