import { CryptoPriceEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { TransportRoutes } from '@chainlink/external-adapter-framework/transports'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { config, priceInputParameters } from '../config'
import { wsTransport } from './price-ws'

// inputParams expected by both the REST and WS transports
export type AssetMetricsRequestBody = {
  base: string
  quote: string
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
export const transportRoutes = new TransportRoutes<AssetMetricsEndpointTypes>().register(
  'ws',
  wsTransport,
)

export const endpoint = new CryptoPriceEndpoint<AssetMetricsEndpointTypes>({
  name: 'price-ws',
  transportRoutes,
  defaultTransport: 'ws',
  inputParameters: priceInputParameters,
})
