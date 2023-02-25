import { RoutingTransport } from '@chainlink/external-adapter-framework/transports/meta'
import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { httpTransport } from '../http/forex'
import { customSettings } from '../../config'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { wsTransport } from '../ws/forex'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { RouterPriceEndpointParams } from '../../crypto-utils'

const inputParameters = {
  base: {
    aliases: ['from', 'market', 'asset'],
    required: true,
    type: 'string',
    description: 'The asset to query',
  },
  quote: {
    aliases: ['to'],
    required: true,
    type: 'string',
    description: 'The quote to convert to',
  },
  transport: {
    description: 'which transport to route to',
    required: false,
    type: 'string',
    default: 'rest',
  },
} satisfies InputParameters

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
    Params: RouterPriceEndpointParams
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
    ws: wsTransport,
    rest: httpTransport,
  },
  (_, adapterConfig) => (adapterConfig?.WS_ENABLED ? 'ws' : 'rest'),
)

export const endpoint = new AdapterEndpoint<ForexEndpointTypes>({
  name: 'forex',
  aliases: ['fx', 'commodities'],
  transport: routingTransport,
  inputParameters: inputParameters,
})
