import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/ea-bootstrap'

export const NAME = 'FLIGHTAWARE'

export const DEFAULT_ENDPOINT = 'estimatedarrivaltime'
export const DEFAULT_BASE_URL = 'https://flightxml.flightaware.com/json/FlightXML2'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix, true)
  config.api.auth = {
    ...config.api.auth,
    username: util.getRequiredEnv('API_USERNAME'),
    password: '',
  }
  config.api.baseURL = config.api.baseURL || DEFAULT_BASE_URL
  config.defaultEndpoint = DEFAULT_ENDPOINT
  return config
}
