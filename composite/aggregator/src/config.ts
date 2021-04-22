import { Config as AdapterConfig } from '@chainlink/types'
import { Requester } from '@chainlink/external-adapter'
import { util } from '@chainlink/ea-bootstrap'

export type Config = AdapterConfig & {
  endpoints: { [provider: string]: string }
  customPaths: { [provider: string]: string[] }
  reduce: string
}
export const ENV_DATA_PROVIDER_URL = 'DATA_PROVIDER_URL'
export const DEFAULT_DATA_PATH = 'result'
export const NAME = 'aggregator'
export const DEFAULT_REDUCER = 'average'

export const makeConfig = (prefix = ''): Config => {
  const dataProviders = util.getRequiredEnv('DATA_PROVIDERS', prefix).split(',')
  const config = Requester.getDefaultConfig(prefix)
  config.reduce = util.getRequiredEnv(ENV_DATA_PROVIDER_URL, 'REDUCE')

  // fetch endpoints of various data providers
  dataProviders.forEach((p: string) => {
    config.endpoints = {
      ...config.endpoints,
      [p.toUpperCase()]: util.getRequiredEnv(
        ENV_DATA_PROVIDER_URL,
        p.toUpperCase().replace('-', '_'),
      ),
    }
  })

  // fetch custom paths for returned data
  const dataPaths = util.getEnv('DATA_PATHS', prefix)
  if (dataPaths) {
    dataPaths.split(',').forEach((p: string) => {
      const pSplit = p.split(':')
      config.customPaths = {
        ...config.customPaths,
        [pSplit[0].toUpperCase()]: pSplit[1].split('/'),
      }
    })
  }

  return config
}
