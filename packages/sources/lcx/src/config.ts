import { Requester } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'
import { util } from '@chainlink/ea-bootstrap'

export const NAME = 'LCX'

export const DEFAULT_BASE_URL = 'https://rp.lcx.com/v1/rates/current'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix, true)
  config.api.baseURL = config.api.baseURL || DEFAULT_BASE_URL
  config.api.headers['api-key'] = util.getRandomRequiredEnv('API_KEY')
  return config
}
