import { Requester } from '@chainlink/external-adapter'
import { Config } from '@chainlink/types'
export { Config } from '@chainlink/types'
import { NAME } from './endpoint/vehicle'

export const DEFAULT_ENDPOINT = NAME

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix)
  config.api.baseURL = config.api.baseURL || 'http://api.marketcheck.com/v2/'
  config.api.headers = { ...config.api.headers, Host: 'marketcheck-prod.apigee.net' }
  return config
}
