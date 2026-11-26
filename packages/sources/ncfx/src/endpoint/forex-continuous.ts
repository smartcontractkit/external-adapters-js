import {
  AdapterEndpoint,
  LwbaResponseDataFields,
  lwbaEndpointInputParametersDefinition,
  validateLwbaResponse,
} from '@chainlink/external-adapter-framework/adapter'
import { TransportRoutes } from '@chainlink/external-adapter-framework/transports'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { AdapterLWBAError } from '@chainlink/external-adapter-framework/validation/error'
import { config } from '../config'
import { makeForexContinuousTransport } from '../transport/forex-continuous'
import { customInputValidation } from './crypto'

const PRIMARY_TRANSPORT = 'ws'
const SECONDARY_TRANSPORT = 'wssecondary'

/**
 * Separate connections for forward and reverse forex-continuous pairs eg: ARS/USD, USD/ARS
 * across two connections by alphabetical order. Each direction is served directly from NCFX
 *
 * Uppercase the base and quote for consistency.
 */
export const routeForPair = (base: string, quote: string): string =>
  base.toUpperCase() < quote.toUpperCase() ? PRIMARY_TRANSPORT : SECONDARY_TRANSPORT

export const inputParameters = new InputParameters(lwbaEndpointInputParametersDefinition, [
  {
    base: 'ARS',
    quote: 'USD',
  },
])

export type BaseEndpointTypesForexContinuous = {
  Parameters: typeof inputParameters.definition
  Settings: typeof config.settings
  Response: LwbaResponseDataFields
}

export const forexContinuousEndpoint = new AdapterEndpoint({
  name: 'forex-continuous',
  customInputValidation,
  transportRoutes: new TransportRoutes<BaseEndpointTypesForexContinuous>()
    .register(PRIMARY_TRANSPORT, makeForexContinuousTransport())
    .register(SECONDARY_TRANSPORT, makeForexContinuousTransport()),
  defaultTransport: PRIMARY_TRANSPORT,
  customRouter: (req) => routeForPair(req.requestContext.data.base, req.requestContext.data.quote),
  inputParameters,
  requestTransforms: [
    (req) => {
      req.requestContext.data.base = req.requestContext.data.base.toUpperCase()
      req.requestContext.data.quote = req.requestContext.data.quote.toUpperCase()
    },
  ],
  customOutputValidation: (output) => {
    const data = output.data as { bid: number; mid: number; ask: number }
    const error = validateLwbaResponse(data.bid, data.mid, data.ask)
    if (error) {
      throw new AdapterLWBAError({ statusCode: 500, message: error })
    }
    return undefined
  },
})
