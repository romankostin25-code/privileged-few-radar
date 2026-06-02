export type HeatLevel = 'hot' | 'warm' | 'cool'
export type Category = 'wealth' | 'relationships' | 'class' | 'celebrity' | 'culture'
export type Platform = 'instagram' | 'instagram_reels' | 'tiktok' | 'twitter' | 'youtube' | 'news'

export interface Trend {
  id: string
  title: string
  summary: string
  angle: string
  category: Category
  heat: HeatLevel
  tags: string[]
  platform: Platform
  fetchedAt: string
}
