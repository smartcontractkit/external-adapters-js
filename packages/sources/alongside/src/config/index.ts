import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig(
  {
    API_ENDPOINT: {
      description: 'The HTTP URL to retrieve data from',
      type: 'string',
      default: 'https://api.prime.coinbase.com/v1',
    },
    ACCESS_KEY: {
      description: 'An API key for alongside',
      type: 'string',
      required: true,
      sensitive: true,
    },
    PASSPHRASE: {
      description: 'An passphrase for alongside',
      type: 'string',
      required: true,
      sensitive: true,
    },
    PORTFOLIO_ID: {
      description: 'The portfolio id for alongside',
      type: 'string',
      required: true,
      sensitive: true,
    },
    SIGNING_KEY: {
      description: 'The signing Key',
      type: 'string',
      required: true,
      sensitive: true,
    },
    RPC_URL: {
      description: 'The RPC URL to connect to the EVM chain the contract is deployed to',
      type: 'string',
      required: true,
    },
    BACKGROUND_EXECUTE_MS: {
      description:
        'The amount of time the background execute should sleep before performing the next request',
      type: 'number',
      default: 10_000,
    },
  },
  {
    envDefaultOverrides: {
      BACKGROUND_EXECUTE_TIMEOUT: 180_000,
    },
  },
)
