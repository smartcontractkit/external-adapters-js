const AMINA_API_PATH = '/api/b2c/v1'

export function trimEndpoint(apiEndpoint: string): string {
  return apiEndpoint.replace(/\/+$/, '')
}

export function authUrl(apiEndpoint: string): string {
  return `${trimEndpoint(apiEndpoint)}${AMINA_API_PATH}/auth`
}

export function positionsPath(portfolioNo: number): string {
  return `${AMINA_API_PATH}/securities/portfolios/${portfolioNo}/positions`
}
