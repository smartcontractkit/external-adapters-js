export const TEST_URL = 'https://localhost:12345'
export const TEST_SUCCESS_ASSET_ID = 'KUSPUM'
export const TEST_FAILURE_ASSET_ID = 'ROLSUB'

export const SuccessResponseAsset = {
  asset_id: 'KUSPUM',
  asset_info_category: 'Artwork',
  asset_info_creator: 'Yayoi Kusama',
  asset_info_title: 'Pumpkin (2)',
  asset_info_year_created: '1990',
  asset_info_description:
    'Yayoi Kusama is a living legend whose polka-dotted universe has taken over museums, fashion, and the auction block—generating a $2.4B market cap. From MoMA to Louis Vuitton, her iconic Infinity Rooms and Pumpkin artworks have made her one of the most collected artists alive',
  asset_info_url: 'https://liveart.io/analytics/artworks/wDigKX/yayoi-kusama',
  current_estimated_nav_usd: '67410.81654052',
  current_estimated_nav_updated_at: '2025-10-13T08:50:09.546855',
  token_total_shares: 700000,
  token_current_estimated_nav_per_share_usd: '0.09630117',
  offering_price_usd: '70000.00000000',
  success: true,
  message: '',
  response_timestamp: '2025-10-20T13:01:12.095377',
}

export const ErrorResponseAsset = {
  asset_id: 'ROLSUB',
  asset_info_category: '',
  asset_info_creator: '',
  asset_info_title: '',
  asset_info_year_created: '',
  asset_info_description: '',
  asset_info_url: '',
  current_estimated_nav_usd: '',
  current_estimated_nav_updated_at: '',
  token_total_shares: 0,
  token_current_estimated_nav_per_share_usd: '',
  offering_price_usd: '',
  success: false,
  message: "Asset ID 'AssetId.ROLSUB' not found",
  response_timestamp: '2025-10-21T11:45:51.122126',
}

export const SuccessResponseAssets = [
  {
    asset_id: 'HARPLA',
    asset_info_category: 'Artwork',
    asset_info_creator: 'Keith Haring',
    asset_info_title: 'Pop Shop IV - Plate II (Radiant Baby)',
    asset_info_year_created: '1989',
    asset_info_description:
      'Keith Haring is a blue-chip icon with a $644M market cap. His market has an 89% sell-through rate with a price over estimate of 27% . His Pop Shop and Icons series are among his most popular artworks. Collaborations with brands like Uniqlo and Coach keep Haring mainstream while growing his collector base across new demographics. Making him one of the most tradable names in the art market.',
    asset_info_url:
      'https://liveart.io/analytics/artworks/z6bjtr/keith-haring/pop-shop-iv-plate-ii-radiant-baby',
    current_estimated_nav_usd: '31394.78318046',
    current_estimated_nav_updated_at: '2025-10-13T12:40:08.641656',
    token_total_shares: 350000,
    token_current_estimated_nav_per_share_usd: '0.08969938',
    offering_price_usd: '35000.00000000',
    success: true,
    message: '',
    response_timestamp: '2025-10-20T12:37:58.430630',
  },
  {
    asset_id: 'HOCPOO',
    asset_info_category: 'Artwork',
    asset_info_creator: 'David Hockney',
    asset_info_title: 'Paper Pool',
    asset_info_year_created: '1980',
    asset_info_description:
      'David Hockney is one of the world’s most valuable living artists, with a $1.9B market cap and a record sale topping $90M.',
    asset_info_url: 'https://liveart.io/analytics/artworks/wW9yWc/david-hockney',
    current_estimated_nav_usd: '63983.64635652',
    current_estimated_nav_updated_at: '2025-10-13T12:40:08.648848',
    token_total_shares: 600000,
    token_current_estimated_nav_per_share_usd: '0.10663941',
    offering_price_usd: '60000.00000000',
    success: true,
    message: '',
    response_timestamp: '2025-10-20T12:37:58.430678',
  },
]
