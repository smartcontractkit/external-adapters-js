import { InputParameters } from '@chainlink/external-adapter-framework/validation'

export const DEFAULT_API_ENDPOINT = 'https://api.coinmetrics.io/v4'
export const DEFAULT_WS_API_ENDPOINT = 'wss://api.coinmetrics.io/v4'

// Quote values are used to find a dynamic property in the DP response, in the form of ReferenceRate{quote}
// Since we use hard property names in response types, we need to make sure that only expected quote values appear in params
export enum VALID_QUOTES {
  USD = 'USD',
  EUR = 'EUR',
  ETH = 'ETH',
  BTC = 'BTC',
}

export const customSettings = {
  API_KEY: {
    description: 'The coinmetrics API key',
    type: 'string',
    required: true,
    sensitive: true,
  },
  WS_API_ENDPOINT: {
    description: 'The websocket url for coinmetrics',
    type: 'string',
    required: true,
    default: DEFAULT_WS_API_ENDPOINT,
  },
  API_ENDPOINT: {
    description: 'The API url for coinmetrics',
    type: 'string',
    required: true,
    default: DEFAULT_API_ENDPOINT,
  },
} as const

export const priceInputParameters: InputParameters = {
  base: {
    type: 'string',
    description: 'The symbol of symbols of the currency to query',
    required: true,
    aliases: ['from', 'coin'],
  },
  quote: {
    type: 'string',
    description: 'The symbol of the currency to convert to',
    required: true,
    aliases: ['to', 'market'],
    options: Object.values(VALID_QUOTES),
  },
}

export interface ResponseSchema {
  data: {
    asset: string
    time: string
    ReferenceRateUSD?: string
    ReferenceRateEUR?: string
  }[]
  error?: {
    type: string
    message: string
  }
}
