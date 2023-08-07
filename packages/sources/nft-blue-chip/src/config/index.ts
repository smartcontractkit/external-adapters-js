import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const defaultEndpoint = 'marketcap'

export const config = new AdapterConfig({
  ETHEREUM_RPC_URL: {
    description: 'RPC URL to an Ethereum mainnet node',
    type: 'string',
    required: true,
  },
  MARKETCAP_TRANSPORT_MAX_RATE_LIMIT_RETRIES: {
    description:
      'Maximum amount of times the Marketcap Transport will attempt to set up a request when blocked by the rate limiter',
    type: 'number',
    default: 3,
  },
  MARKETCAP_TRANSPORT_MS_BETWEEN_RATE_LIMIT_RETRIES: {
    description:
      'Time that the Marketcap Transport will wait between retries when blocked by the rate limiter',
    type: 'number',
    default: 400,
  },
})
