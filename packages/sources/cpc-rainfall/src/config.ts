import { Requester } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export const NAME = 'CPC_RAINFALL' // This should be filled in with a name corresponding to the data provider using UPPERCASE and _underscores_.

export const RAINFALL_URL = 'https://453q3o3us5.execute-api.us-east-1.amazonaws.com/dev/rainfall'
export const API_KEY = ""
export const CALLBACK_URL = ""

export const CONTENT_TYPE = "content-type"
export const APPLICATION_JSON = "application/json"
export const X_API_KEY = "X-Api-Key"
export const X_API_KEY_VALUE = ""

export const DEFAULT_SECRET_ID = 1

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix)
  return config
}
