import { getApiConfig } from '../config'

export const prepareRequests = <T extends { apiName: string }>(params: T[]) => {
  return params.map((param) => {
    const apiConfig = getApiConfig(param.apiName)
    return {
      params: [param],
      request: {
        baseURL: apiConfig.url,
        ...(apiConfig.authHeader
          ? {
              headers: {
                [apiConfig.authHeader]: apiConfig.authHeaderValue,
              },
            }
          : {}),
      },
    }
  })
}
