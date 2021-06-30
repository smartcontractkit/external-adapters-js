import { Requester } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export const DEFAULT_ENDPOINT = 'total-score'
export const DEFAULT_BASE_URL = 'https://therundown-therundown-v1.p.rapidapi.com/'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix, true)
  console.log("=============")
  config.api = {
    ...config.api,
    baseURL: config.api.baseURL || DEFAULT_BASE_URL,
    headers: {
      // ...config.api.headers,
      'X-RapidAPI-Key': 'e1a9c7d931msh77c241f46ede29cp184befjsn3425084a239c',
      'x-rapidapi-host': 'therundown-therundown-v1.p.rapidapi.com',
    },
  }
  console.log(config);
  return config
}
