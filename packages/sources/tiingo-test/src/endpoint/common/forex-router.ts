import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { httpTransport } from '../http/forex'
import { customSettings } from '../../config'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { wsTransport } from '../ws/forex'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { RouterPriceEndpointParams } from '../../crypto-utils'
import overrides from '../../config/overrides.json'

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

export const endpoint = new AdapterEndpoint<ForexEndpointTypes>({
  name: 'forex',
  aliases: ['fx', 'commodities'],
  transports: {
    ws: wsTransport,
    rest: httpTransport,
  },
  defaultTransport: 'rest',
  inputParameters: inputParameters,
  overrides: overrides.tiingo,
})
