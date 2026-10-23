import {
  AdapterEndpoint,
  priceEndpointInputParametersDefinition,
} from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { config } from '../config'
import { buildQuoteTransport, WsTransportTypes } from '../transport/stock_quotes'
import { FillFirstTransportRoutes } from './common'

export const inputParameters = new InputParameters(priceEndpointInputParametersDefinition, [
  {
    base: 'Equity:US:AAPL',
    quote: 'USD',
  },
])

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: {
    Result: null
    Data: {
      mid_price: number
      bid_price: number
      ask_price: number
    }
  }
  Settings: typeof config.settings
}

const transportRoutes = new FillFirstTransportRoutes<WsTransportTypes>(buildQuoteTransport)

export const endpoint = new AdapterEndpoint({
  name: 'stock_quotes',
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
