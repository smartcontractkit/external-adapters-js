export const customSettings = {
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
  INFURA_KEY: {
    description: 'The infura key',
    type: 'string',
    required: true,
    sensitive: true,
  },
} as const
