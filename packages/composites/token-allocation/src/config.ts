import { util } from '@chainlink/ea-bootstrap'
import { Requester } from '@chainlink/ea-bootstrap'
import { getDataProvider } from './dataProvider'
import { Config, SourceRequestOptions } from './types'
import { adapters } from './dataProvider'

export const DEFAULT_TOKEN_DECIMALS = 18
export const DEFAULT_TOKEN_BALANCE = 1

export const ENV_DATA_PROVIDER_URL = 'DATA_PROVIDER_URL'

export const getURL = (prefix: string, required = false) =>
  required
    ? util.getRequiredEnv(ENV_DATA_PROVIDER_URL, prefix)
    : util.getEnv(ENV_DATA_PROVIDER_URL, prefix)

export const makeConfig = (prefix = ''): Config => {
  const sources: SourceRequestOptions = {}

  for (const { NAME } of adapters) {
    const url = getURL(NAME)
    if (url) {
      const defaultConfig = Requester.getDefaultConfig(prefix)
      defaultConfig.api.baseURL = url
      defaultConfig.api.method = 'post'
      sources[NAME.toLowerCase()] = getDataProvider(defaultConfig.api)
    }
  }

  return {
    sources,
    defaultMethod: util.getEnv('DEFAULT_METHOD', prefix) || 'price',
    defaultQuote: util.getEnv('DEFAULT_QUOTE') || 'USD',
  }
}

export const makeOptions = ({ sources }: Config) => {
  const sourceOptions = Object.keys(sources).map((s) => s.toLowerCase())
  return {
    source: sourceOptions,
  }
}
