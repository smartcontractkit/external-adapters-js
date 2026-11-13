const AMINA_API_PATH = '/api/b2c/v1'

// The requirement names the hosts without the API prefix. Accept the OpenAPI
// server URL too, so an operator cannot double-prefix the path and break the
// signed `Amina-Uri`.
export function trimEndpoint(apiEndpoint: string): string {
  return apiEndpoint.replace(/\/+$/, '').replace(/\/api\/b2c\/v1$/, '')
}

export function authUrl(apiEndpoint: string): string {
  return `${trimEndpoint(apiEndpoint)}${AMINA_API_PATH}/auth`
}

export function positionsPath(portfolioNo: number): string {
  return `${AMINA_API_PATH}/securities/portfolios/${portfolioNo}/positions`
}
