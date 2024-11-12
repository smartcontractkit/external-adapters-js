import { Requester, util } from '@chainlink/ea-bootstrap'
import type { AxiosRequestConfig, Config } from '@chainlink/ea-bootstrap'

export const DEFAULT_DATASET = 'bigquery-public-data.noaa_gsod'
export const NAME = 'GOOGLE_WEATHER'
export const DEFAULT_ENDPOINT = 'weather'

export interface ExtendedConfig extends Config {
  dataset: string
  api: AxiosRequestConfig
}

export const makeConfig = (prefix?: string): ExtendedConfig => ({
  ...Requester.getDefaultConfig(prefix),
  dataset: util.getEnv('DATASET', prefix) || DEFAULT_DATASET,
  api: {},
  defaultEndpoint: DEFAULT_ENDPOINT,
})
