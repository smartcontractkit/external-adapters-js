import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export const NAME = 'COINPAPRIKA'

export const DEFAULT_ENDPOINT = 'crypto'
export const DEFAULT_API_ENDPOINT = 'https://api.coinpaprika.com'
export const PRO_API_ENDPOINT = 'https://api-pro.coinpaprika.com'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix)
  const headers: { [T: string]: string | boolean } = {}
  if (config.apiKey) headers['Authorization'] = config.apiKey

  const isInTestMode = util.parseBool(util.getEnv('IS_TEST_MODE', prefix))
  if (isInTestMode) headers['COINPAPRIKA-API-KEY-VERIFY'] = true

  config.api = {
    ...config.api,
    baseURL: config.api.baseURL || config.apiKey ? PRO_API_ENDPOINT : DEFAULT_API_ENDPOINT,
    headers,
  }
  config.defaultEndpoint = DEFAULT_ENDPOINT
  return config
}
