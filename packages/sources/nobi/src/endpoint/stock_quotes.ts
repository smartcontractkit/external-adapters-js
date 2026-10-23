import {
  AdapterEndpoint,
  priceEndpointInputParametersDefinition,
} from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { config } from '../config'
import { buildQuoteTransport, WsTransportTypes } from '../transport/stock_quotes'
import { FillFirstTransportRoutes } from './common'

export const inputParameters = new InputParameters(
  {
    ...priceEndpointInputParametersDefinition,
    requireVolume: {
      default: false,
      description: 'If true, throw error if bid/ask volume is invalid',
      type: 'boolean',
    },
  },
  [
    {
      base: 'Equity:US:AAPL',
      quote: 'USD',
      requireVolume: false,
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: {
    Result: number
    Data: {
      mid_price: number
      bid_price: number
      bid_volume: number | undefined
      ask_price: number
      ask_volume: number | undefined
      last_price: number
    }
  }
  Settings: typeof config.settings
}

const transportRoutes = new FillFirstTransportRoutes<WsTransportTypes>(buildQuoteTransport)

export const endpoint = new AdapterEndpoint({
  name: 'stock_quotes',
  aliases: ['stock'],
  inputParameters,
  customInputValidation: (_, settings): AdapterInputError | undefined => {
    if (!settings.QUOTES_API_KEY) {
      throw new AdapterInputError({
        statusCode: 400,
        message: 'QUOTES_API_KEY is required for stock_quotes endpoint',
      })
    }
    return
  },
  transportRoutes: transportRoutes.getTransportRoutes(),
  defaultTransport: transportRoutes.defaultTransportName(),
  customRouter: (req, settings) =>
    transportRoutes.routeRequest(
      req.requestContext.data.base,
      req.requestContext.data.quote,
      settings.MAX_SUBSCRIPTIONS_PER_TRANSPORT,
    ),
})
