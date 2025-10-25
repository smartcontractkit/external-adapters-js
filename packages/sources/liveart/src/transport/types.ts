export interface Asset {
  asset_id: string
  asset_info_category: string
  asset_info_creator: string
  asset_info_title: string
  asset_info_year_created: string
  asset_info_description: string
  asset_info_url: string
  current_estimated_nav_usd: string
  current_estimated_nav_updated_at: string
  token_total_shares: number
  token_current_estimated_nav_per_share_usd: string
  offering_price_usd: string
  success: boolean
  message: string
  response_timestamp: string
}
