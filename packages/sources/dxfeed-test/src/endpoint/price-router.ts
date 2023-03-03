import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { batchTransport } from './price'
import {
  AdapterRequest,
  SingleNumberResultResponse,
} from '@chainlink/external-adapter-framework/util'
import { wsTransport } from './price-ws'
import { customSettings } from '../config'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import overrides from '../config/overrides.json'
import { AdapterConfig } from '@chainlink/external-adapter-framework/config'
import {
  AdapterError,
  AdapterInputError,
} from '@chainlink/external-adapter-framework/validation/error'

export const inputParameters = {
  base: {
    aliases: ['from', 'coin', 'market'],
    type: 'string',
    description: 'The symbol of the currency to query',
    required: true,
  },
} satisfies InputParameters

export interface ProviderResponseBody {
  status: string
  Trade: {
    [key: string]: {
      eventSymbol: string
      eventTime: number
      time: number
      timeNanoPart: number
      sequence: number
      exchangeCode: string
      price: number
      change: number
      size: number
      dayVolume: number
      dayTurnover: number
      tickDirection: string
      extendedTradingHours: boolean
    }
  }
  Quote: {
    [key: string]: {
      eventSymbol: string
      eventTime: number
      timeNanoPart: number
      bidTime: number
      bidExchangeCode: string
      bidPrice: number
      bidSize: number
      askTime: number
      askExchangeCode: string
      askPrice: number
      askSize: number
      sequence: number
    }
  }
}

export interface RequestParams {
  base: string
}

export type EndpointTypes = {
  Request: {
    Params: RequestParams
  }
  Response: SingleNumberResultResponse
  CustomSettings: typeof customSettings
  Provider: {
    RequestBody: never
    ResponseBody: ProviderResponseBody
  }
}

function customInputValidation(
  req: AdapterRequest<EndpointTypes['Request']>,
  config: AdapterConfig<typeof customSettings>,
): AdapterError | undefined {
  if (req.requestContext.transportName === 'ws' && !config.WS_API_ENDPOINT) {
    return new AdapterInputError({
      statusCode: 400,
      message: 'WS_API_ENDPOINT is not set',
    })
  }
  return
}

export const endpoint = new AdapterEndpoint<EndpointTypes>({
  name: 'price',
  aliases: ['crypto', 'stock', 'forex', 'commodities'],
  transports: {
    ws: wsTransport,
    rest: batchTransport,
  },
  defaultTransport: 'rest',
  inputParameters: inputParameters,
  overrides: overrides.dxfeed,
  customInputValidation,
})
