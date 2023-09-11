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

export const equitiesInputParameters = new InputParameters(stockEndpointInputParametersDefinition, [
  {
    base: 'CSPX',
  },
])

export type EquitiesEndpointTypes = {
  Parameters: typeof equitiesInputParameters.definition
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
