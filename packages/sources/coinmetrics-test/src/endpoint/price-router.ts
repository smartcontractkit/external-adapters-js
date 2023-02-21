import { RoutingTransport } from '@chainlink/external-adapter-framework/transports/meta'
import { wsTransport } from './price-ws'
import { customSettings, priceInputParameters } from '../config'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { CryptoPriceEndpoint } from '@chainlink/external-adapter-framework/adapter'

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
  CustomSettings: typeof customSettings
}

// Currently only routes to websocket. Stub is here for the follow-up release that will add in REST routes.
export const routingTransport = new RoutingTransport<AssetMetricsEndpointTypes>(
  {
    WS: wsTransport,
  },
  () => {
    return 'WS'
  },
)

export const endpoint = new CryptoPriceEndpoint<AssetMetricsEndpointTypes>({
  name: 'price-ws',
  transport: routingTransport,
  inputParameters: priceInputParameters,
})
