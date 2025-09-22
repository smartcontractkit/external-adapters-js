export interface ApiRequestConfig {
  baseURL: string
  url?: string
  headers?: Record<string, string>
  method?: string
  data?: any
}

export class RequestHelper {
  static createAuthenticatedGetRequest(
    baseURL: string,
    bearerToken: string,
    path?: string,
  ): ApiRequestConfig {
    return {
      baseURL,
      url: path,
      headers: {
        Authorization: `Bearer ${bearerToken}`,
      },
    }
  }

  static createNavRequest(baseURL: string, bearerToken: string, fundId: number): ApiRequestConfig {
    return this.createAuthenticatedGetRequest(baseURL, bearerToken, `/${fundId}/nav-daily`)
  }

  static createReserveRequest(
    baseURL: string,
    bearerToken: string,
    fundId: number,
  ): ApiRequestConfig {
    return this.createAuthenticatedGetRequest(baseURL, bearerToken, `/${fundId}/reserves`)
  }
}
