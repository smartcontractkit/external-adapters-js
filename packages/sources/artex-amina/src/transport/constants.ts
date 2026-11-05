export const AMINA_API_PATH = '/api/b2c/v1'

export const PAGE_SIZE = 20

export const MAX_PAGES = 100

export const ACTIVE_CACHE_CHECK_MS = 100

export const ACCESS_TOKEN_TTL_MS = 60 * 60 * 1000

export const REFRESH_TOKEN_TTL_MS = 24 * 60 * 60 * 1000

export const TOKEN_EXPIRY_BUFFER_MS = 60 * 1000

export function authUrl(apiEndpoint: string): string {
  return `${trimEndpoint(apiEndpoint)}${AMINA_API_PATH}/auth`
}

export function positionsPath(portfolioNo: number): string {
  return `${AMINA_API_PATH}/securities/portfolios/${portfolioNo}/positions`
}

export function trimEndpoint(apiEndpoint: string): string {
  return apiEndpoint.replace(/\/+$/, '')
}
