import { wsTransport } from './lwba-ws'
import { config } from '../config'
import {
  AdapterEndpoint,
  priceEndpointInputParameters,
  PriceEndpointParams,
} from '@chainlink/external-adapter-framework/adapter'
import { TransportRoutes } from '@chainlink/external-adapter-framework/transports'

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
  Settings: typeof config.settings
}

// Currently only routes to websocket. Stub is here for the follow-up release that will add in REST routes.
export const transportRoutes = new TransportRoutes<CryptoLwbaEndpointTypes>().register(
  'ws',
  wsTransport,
)

export const endpoint = new AdapterEndpoint<CryptoLwbaEndpointTypes>({
  name: 'crypto-lwba',
  aliases: ['crypto_lwba'],
  transportRoutes,
  defaultTransport: 'ws',
  inputParameters: priceEndpointInputParameters,
})
