export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Casino {
  id: string
  name: string
  bonus_description: string
  is_active: boolean
  sort_order: number
  created_at: string
}

export interface UserClaim {
  id: string
  user_id: string
  casino_id: string
  claimed_date: string
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

export interface CasinoWithClaim extends Casino {
  claimed_today: boolean
  streak: number
}
