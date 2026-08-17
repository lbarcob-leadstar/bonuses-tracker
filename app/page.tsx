import { createClient } from '@/lib/supabase-server'
import type { Metadata } from 'next'
import type { LandingBlock } from '@/types'
import LandingClient from './LandingClient'

const LANDING_DEFAULTS = {
  page_title: 'United Gamblers Daily Bonus Tracker',
  meta_description: 'Track all your sweepstakes casino daily bonuses in one place.',
  hero_badge: 'Built for daily bonus grinders',
  hero_description: 'United Gamblers Daily Bonus Tracker helps sweepstakes casino players track, claim and manage their daily bonuses across all major brands — all in one place. Claim faster, keep streaks alive, and monitor your daily progress.',
}

async function getLandingData() {
  try {
    const supabase = await createClient()
    const [{ data: config }, { data: blocks }] = await Promise.all([
      supabase.from('landing_config').select('*').single(),
      supabase.from('landing_blocks').select('*').eq('is_active', true).order('sort_order'),
    ])
    return { config, blocks: (blocks ?? []) as LandingBlock[] }
  } catch {
    return { config: null, blocks: [] as LandingBlock[] }
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const { config } = await getLandingData()
  return {
    title: config?.page_title ?? LANDING_DEFAULTS.page_title,
    description: config?.meta_description ?? LANDING_DEFAULTS.meta_description,
  }
}

export default async function Home() {
  const { config, blocks } = await getLandingData()
  return (
    <LandingClient
      heroBadge={config?.hero_badge ?? LANDING_DEFAULTS.hero_badge}
      heroDescription={config?.hero_description ?? LANDING_DEFAULTS.hero_description}
      contentBlocks={blocks}
    />
  )
}
