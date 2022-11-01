export const DEFAULT_API_ENDPOINT = 'https://min-api.cryptocompare.com'
export const DEFAULT_WS_API_ENDPOINT = 'wss://streamer.cryptocompare.com/v2'

export const defaultEndpoint = 'crypto'

export const customSettings = {
  // TODO: Temp commented out to not cause conflicts with EA framework config. Uncomment on the next EA framework release
  /*API_KEY: {
    description: 'The CryptoCompare API key',
    type: 'string',
    required: true,
    sensitive: true,
  },
  WS_API_KEY: {
    description: 'The websocket API key to authenticate with, if different from API_KEY',
    type: 'string',
    sensitive: true,
  },*/
} as const
