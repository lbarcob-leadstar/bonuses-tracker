export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Casino {
  id: string
  name: string
  bonus_description: string
  welcome_offer_info: string | null
  logo_url: string | null
  casino_url: string | null
  logo_primary_color: string | null
  logo_secondary_color: string | null
  min_redemption: number | null
  reset_at_midnight: boolean
  sc_amount: number | null
  gc_amount: number | null
  is_active: boolean
  sort_order: number
  created_at: string
}

export interface UserFavorite {
  id: string
  user_id: string
  casino_id: string
  created_at: string
}

export interface UserClaim {
  id: string
  user_id: string
  casino_id: string
  claimed_date: string
  claimed_at: string
  streak: number
  last_claim_date: string | null
  updated_at: string
}

export interface Profile {
  id: string
  email: string | null
  is_admin: boolean
  created_at: string
}

export interface FeaturedBonus {
  id: string
  title: string
  subtitle: string | null
  description: string
  background_image_url: string | null
  is_active: boolean
  sort_order: number
  created_at: string
}

export interface CasinoWithClaim extends Casino {
  last_claimed_at: string | null
  streak: number
  is_favorite: boolean
}
