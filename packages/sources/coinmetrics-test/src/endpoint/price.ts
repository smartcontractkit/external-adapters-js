import { CryptoPriceEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { TransportRoutes } from '@chainlink/external-adapter-framework/transports'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { config, priceInputParameters, VALID_QUOTES } from '../config'
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

// Currently only routes to websocket. Stub is here for the follow-up release that will add in REST routes.
export const transportRoutes = new TransportRoutes<AssetMetricsEndpointTypes>()
  .register('ws', wsTransport)
  .register('http', httpTransport)

export const endpoint = new CryptoPriceEndpoint<AssetMetricsEndpointTypes>({
  name: 'price',
  aliases: ['price-ws'],
  transportRoutes,
  defaultTransport: 'http',
  inputParameters: priceInputParameters,
})
