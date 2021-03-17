import { Requester } from '@chainlink/external-adapter'
import { Config } from '@chainlink/types'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix)
  config.api.baseURL = config.api.baseURL || 'https://marketdata.tradermade.com/api/v1/live'
  config.api.params = { api_key: config.apiKey }
  return config
}
