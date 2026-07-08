export type HeatLevel = 'hot' | 'warm' | 'cool'
export type Category = 'wealth' | 'relationships' | 'class' | 'celebrity' | 'culture'
export type Platform = 'instagram' | 'instagram_reels' | 'tiktok' | 'twitter' | 'youtube' | 'news' | 'reddit'
export type TrendKind = 'current' | 'predicted'
export type PredictionWindow = '48h' | '3-7d'
export type Confidence = 'high' | 'medium' | 'low'

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
  kind: TrendKind
  // Present only when kind === 'predicted'
  predictedWindow?: PredictionWindow
  confidence?: Confidence
  evidence?: string[]
  reasoning?: string
}
