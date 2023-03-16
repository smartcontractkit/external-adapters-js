import {
  CryptoPriceEndpoint,
  PriceEndpointInputParameters,
} from '@chainlink/external-adapter-framework/adapter'
import { TransportRoutes } from '@chainlink/external-adapter-framework/transports'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { config, VALID_QUOTES } from '../config'
import { httpTransport } from './price-http'
import { wsTransport } from './price-ws'

export type AssetMetricsRequestBody = {
  base: string
  quote: VALID_QUOTES
}

// Common endpoint type shared by the REST and WS transports
export type AssetMetricsEndpointTypes = {
  Response: SingleNumberResultResponse
  Request: {
    Params: AssetMetricsRequestBody
  }
  Settings: typeof config.settings
}

const inputParameters = {
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
  },
} satisfies PriceEndpointInputParameters

// Currently only routes to websocket. Stub is here for the follow-up release that will add in REST routes.
export const transportRoutes = new TransportRoutes<AssetMetricsEndpointTypes>()
  .register('ws', wsTransport)
  .register('http', httpTransport)

export const endpoint = new CryptoPriceEndpoint<AssetMetricsEndpointTypes>({
  name: 'price',
  aliases: ['price-ws'],
  transportRoutes,
  defaultTransport: 'http',
  inputParameters,
  // Custom validation to check that the quote value is valid
  customInputValidation: (req) =>
    VALID_QUOTES[req.requestContext.data.quote]
      ? undefined
      : new AdapterInputError({
          statusCode: 400,
          message: `Value for "quote" parameter must be one of (${Object.values(VALID_QUOTES)})`,
        }),
})
