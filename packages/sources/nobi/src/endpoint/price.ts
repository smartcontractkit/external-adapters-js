import {
  AdapterEndpoint,
  priceEndpointInputParametersDefinition,
} from '@chainlink/external-adapter-framework/adapter'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { buildPriceTransport, WsTransportTypes } from '../transport/price'
import { FillFirstTransportRoutes } from './common'

export const inputParameters = new InputParameters(priceEndpointInputParametersDefinition, [
  {
    base: 'BTC',
    quote: 'USD',
  },
])

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: SingleNumberResultResponse
  Settings: typeof config.settings
}

const transportRoutes = new FillFirstTransportRoutes<WsTransportTypes>(buildPriceTransport)

export const endpoint = new AdapterEndpoint({
  name: 'price',
  aliases: ['crypto', 'state'],
  inputParameters,
  transportRoutes: transportRoutes.getTransportRoutes(),
  defaultTransport: transportRoutes.defaultTransportName(),
  customRouter: (req, settings) =>
    transportRoutes.routeRequest(
      req.requestContext.data.base,
      req.requestContext.data.quote,
      settings.MAX_SUBSCRIPTIONS_PER_TRANSPORT,
    ),
})
