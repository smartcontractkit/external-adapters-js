import { RoutingTransport } from '@chainlink/external-adapter-framework/transports/meta'
import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { httpTransport } from '../http/iex'
import { customSettings } from '../../config'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { wsTransport } from '../ws/iex'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'

interface ProviderResponseBody {
  prevClose: number
  last: number
  lastSaleTimestamp: string
  low: number
  bidSize: number
  askPrice: number
  open: number
  mid: number
  volume: number
  lastSize: number
  tngoLast: number
  ticker: string
  askSize: number
  quoteTimestamp: string
  bidPrice: number
  timestamp: string
  high: number
}

const inputParameters = {
  ticker: {
    aliases: ['base', 'from', 'coin'],
    required: true,
    type: 'string',
    description: 'The stock ticker to query',
  },
  transport: {
    description: 'which transport to route to',
    required: false,
    type: 'string',
    default: 'rest',
  },
} satisfies InputParameters

export type IexRequestParams = { ticker: string; transport: string }

export type IEXEndpointTypes = {
  Request: {
    Params: IexRequestParams
  }
  Response: SingleNumberResultResponse
  CustomSettings: typeof customSettings
  Provider: {
    RequestBody: never
    ResponseBody: ProviderResponseBody[]
  }
}

export const routingTransport = new RoutingTransport<IEXEndpointTypes>(
  {
    ws: wsTransport,
    rest: httpTransport,
  },
  (_, adapterConfig) => (adapterConfig?.WS_ENABLED ? 'ws' : 'rest'),
)

export const endpoint = new AdapterEndpoint<IEXEndpointTypes>({
  name: 'iex',
  aliases: ['stock'],
  transport: routingTransport,
  inputParameters: inputParameters,
})
