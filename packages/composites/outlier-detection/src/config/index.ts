import { AxiosRequestConfig, Config, Requester } from '@chainlink/ea-bootstrap'

export const NAME = 'OUTLIER_DETECTION'
export const DEFAULT_ENDPOINT = 'outlier'
export interface ExtendedConfig extends Config {
  prefix: string
  api: Record<string, unknown>
}

export const makeConfig = (prefix = ''): ExtendedConfig => {
  return {
    ...Requester.getDefaultConfig(prefix),
    defaultEndpoint: DEFAULT_ENDPOINT,
    prefix,
    api: {},
  }
}

export const makeRequestOptions = (prefix: string, url: string): AxiosRequestConfig => {
  const defaultConfig = Requester.getDefaultConfig(prefix)
  return {
    ...defaultConfig.api,
    method: 'post',
    url,
  }
}
