import { priceEndpointInputParametersDefinition } from '@chainlink/external-adapter-framework/adapter'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { stockEndpointInputParametersDefinition } from '@chainlink/external-adapter-framework/adapter/stock'

const priceParams = {
  ...priceEndpointInputParametersDefinition,
  base: {
    ...priceEndpointInputParametersDefinition.base,
    aliases: ['from', 'coin', 'symbol'],
  },
} as const

const etfParams = {
  base: {
    required: true,
    aliases: ['from', 'symbol'],
    description: 'The symbol of the etf to query',
    type: 'string',
  },
  country: {
    required: false,
    description: 'Country code',
    type: 'string',
  },
} as const

export const cryptoPriceInputParameters = new InputParameters(
  {
    ...priceParams,
  },
  [
    {
      base: 'BTC',
      quote: 'USD',
    },
  ],
)

export type CryptoBaseEndpointTypes = {
  Parameters: typeof cryptoPriceInputParameters.definition
  Settings: typeof config.settings
  Response: SingleNumberResultResponse
}

export const forexPriceInputParameters = new InputParameters(
  {
    ...priceParams,
  },
  [
    {
      base: 'GBP',
      quote: 'USD',
    },
  ],
)

export const commoditiesPriceInputParameters = new InputParameters(
  {
    ...priceParams,
  },
  [
    {
      base: 'WTI',
      quote: 'USD',
    },
  ],
)

export type ForexBaseEndpointTypes = {
  Parameters: typeof forexPriceInputParameters.definition
  Settings: typeof config.settings
  Response: SingleNumberResultResponse
}

export const etfInputParameters = new InputParameters(
  {
    ...etfParams,
  },
  [
    {
      base: 'C3M',
    },
  ],
)

export type EtfEndpointTypes = {
  Parameters: typeof etfInputParameters.definition
  Settings: typeof config.settings
  Response: SingleNumberResultResponse
}

export const ukEtfInputParameters = new InputParameters(
  {
    ...etfParams,
    country: {
      default: 'uk',
      description: 'Country code',
      type: 'string',
    },
  },
  [
    {
      base: 'CSPX',
      country: 'uk',
    },
  ],
)

export type UkEtfEndpointTypes = {
  Parameters: typeof ukEtfInputParameters.definition
  Settings: typeof config.settings
  Response: SingleNumberResultResponse
}

export const stockInputParameters = new InputParameters(stockEndpointInputParametersDefinition, [
  {
    base: 'AAPL',
  },
])

export type StockEndpointTypes = {
  Parameters: typeof stockInputParameters.definition
  Settings: typeof config.settings
  Response: SingleNumberResultResponse
}
