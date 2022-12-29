import { RoutingTransport } from '@chainlink/external-adapter-framework/transports/meta'
import { PriceEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { PriceCryptoRequestParams, inputParameters, ProviderRequestBody } from '../../crypto-utils'
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
    Params: PriceCryptoRequestParams
  }
  Response: SingleNumberResultResponse
  CustomSettings: typeof customSettings
  Provider: {
    RequestBody: ProviderRequestBody
    ResponseBody: ProviderResponseBody[]
  }
}

export const routingTransport = new RoutingTransport<ForexEndpointTypes>(
  {
    WS: wsTransport,
    REST: httpTransport,
  },
  (_, adapterConfig) => (adapterConfig?.WS_ENABLED ? 'WS' : 'REST'),
)

export const endpoint = new PriceEndpoint<ForexEndpointTypes>({
  name: 'forex',
  aliases: ['fx', 'commodities'],
  transport: routingTransport,
  inputParameters: inputParameters,
})
