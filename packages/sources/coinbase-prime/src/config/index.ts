import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  API_ENDPOINT: {
    description: 'The HTTP URL to retrieve data from',
    type: 'string',
    default: 'https://api.prime.coinbase.com',
  },
  ACCESS_KEY: {
    description: 'The API key for Coinbase Prime auth',
    type: 'string',
    required: true,
    sensitive: true,
  },
  PASSPHRASE: {
    description: 'The passphrase for Coinbase Prime auth',
    type: 'string',
    required: true,
    sensitive: true,
  },
  SIGNING_KEY: {
    description: 'The signing key for Coinbase Prime auth',
    type: 'string',
    required: true,
    sensitive: true,
  },
  BACKGROUND_EXECUTE_MS: {
    description:
      'The amount of time the background execute should sleep before performing the next request',
    type: 'number',
    default: 10_000,
  },
})
