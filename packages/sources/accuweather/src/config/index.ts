import { Requester } from '@chainlink/ea-bootstrap'
import { DefaultConfig } from '@chainlink/ea-bootstrap'

export const NAME = 'ACCUWEATHER'
export const DEFAULT_BASE_URL = 'http://api.accuweather.com/'
export const DEV_BASE_URL = 'http://apidev.accuweather.com/'

export const makeConfig = (prefix?: string): DefaultConfig => {
  const config = Requester.getDefaultConfig(prefix, true)
  config.api.baseURL = config.api.baseURL || DEFAULT_BASE_URL

  return config
}
