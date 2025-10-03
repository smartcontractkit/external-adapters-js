export const TEST_URL = 'https://test.liveart.ai'
export const TEST_BEARER_TOKEN = 'TEST_TOKEN'

export const SuccessResponse = {
  artwork_id: '<artwork_ID>',
  current_estimated_price_updated_at: '2025-08-28T14:27:11.345Z',
  current_estimated_price: '1000000',
  total_shares: 1000,
  nav_per_share: '0.5',
  valuation_price_date: '2025-08-28',
  valuation_price: '10',
  valuation_method: 'consignment',
  success: true,
  message: null,
  response_timestamp: '2025-08-28T14:27:11.345Z',
}

export const ErrorResponse = {
  artwork_id: '<artwork_ID>',
  current_estimated_price_updated_at: null,
  current_estimated_price: null,
  total_shares: null,
  nav_per_share: null,
  valuation_price_date: null,
  valuation_price: null,
  valuation_method: null,
  success: false,
  message: 'Asset ID <artwork_ID> not found',
  response_timestamp: '2025-08-28T14:27:11.345Z',
}
