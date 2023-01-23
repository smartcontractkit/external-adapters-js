import { RoutingTransport } from '@chainlink/external-adapter-framework/transports/meta'
import { PriceEndpoint, PriceEndpointParams } from '@chainlink/external-adapter-framework/adapter'
import { inputParameters } from '../../crypto-utils'
import { httpTransport } from '../http/forex'
import { customSettings } from '../../config'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { wsTransport } from '../ws/forex'

interface ProviderResponseBody {
  ticker: string
  quoteTimestamp: string
  bidPrice: number
  bidSize: number
  askPrice: number
  askSize: number
  midPrice: number
}

export type ForexEndpointTypes = {
  Request: {
    Params: PriceEndpointParams
  }
  Response: SingleNumberResultResponse
  CustomSettings: typeof customSettings
  Provider: {
    RequestBody: never
    ResponseBody: ProviderResponseBody[]
  }
}

export const routingTransport = new RoutingTransport<ForexEndpointTypes>(
  {
    WS: wsTransport,
    HTTP: httpTransport,
  },
  (_, adapterConfig) => (adapterConfig?.WS_ENABLED ? 'WS' : 'HTTP'),
)

export const endpoint = new PriceEndpoint<ForexEndpointTypes>({
  name: 'forex',
  aliases: ['fx', 'commodities'],
  transport: routingTransport,
  inputParameters: inputParameters,
})
