import { Requester } from '@chainlink/external-adapter'
import { Config } from '@chainlink/types'
import { util } from '@chainlink/ea-bootstrap'

export const DEFAULT_ENDPOINT = 'price'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix)
  config.api = {
    ...config.api,
    baseURL: 'https://www.alphavantage.co/query',
    params: { apikey: util.getRandomRequiredEnv('API_KEY') },
  }
  return config
}
