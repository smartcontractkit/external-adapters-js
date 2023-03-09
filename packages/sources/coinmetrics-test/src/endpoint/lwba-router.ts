import { RoutingTransport } from '@chainlink/external-adapter-framework/transports/meta'
import { wsTransport } from './lwba-ws'
import { customSettings } from '../config'
import {
  AdapterEndpoint,
  priceEndpointInputParameters,
  PriceEndpointParams,
} from '@chainlink/external-adapter-framework/adapter'

// Common endpoint type shared by the REST and WS transports
export type CryptoLwbaEndpointTypes = {
  Response: {
    Result: number
    Data: {
      result: number
      mid: number
      ask: number
      asksize: number
      bid: number
      bidsize: number
      spread: number
    }
  }
  Request: {
    Params: PriceEndpointParams
  }
  CustomSettings: typeof customSettings
}

// Currently only routes to websocket. Stub is here for the follow-up release that will add in REST routes.
export const routingTransport = new RoutingTransport<CryptoLwbaEndpointTypes>(
  {
    WS: wsTransport,
  },
  () => {
    return 'WS'
  },
)

export const endpoint = new AdapterEndpoint<CryptoLwbaEndpointTypes>({
  name: 'crypto-lwba',
  aliases: ['crypto_lwba'],
  transport: routingTransport,
  inputParameters: priceEndpointInputParameters,
})
