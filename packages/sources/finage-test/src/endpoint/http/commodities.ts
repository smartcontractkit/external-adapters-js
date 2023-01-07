import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { PriceEndpoint, PriceEndpointParams } from '@chainlink/external-adapter-framework/adapter'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { customSettings } from '../../config'

export const inputParameters = {
  base: {
    aliases: ['from', 'coin'],
    required: true,
    type: 'string',
    description: 'The symbol of symbols of the currency to query',
  },
  quote: {
    aliases: ['to', 'market'],
    required: true,
    type: 'string',
    description: 'The symbol of the currency to convert to',
  },
} as const

interface ResponseSchema {
  symbol: string
  price: number
  timestamp: number
}

type EndpointTypes = {
  Request: {
    Params: PriceEndpointParams
  }
  Response: SingleNumberResultResponse
  CustomSettings: typeof customSettings
  Provider: {
    RequestBody: { apikey: string }
    ResponseBody: ResponseSchema
  }
}

export const httpTransport = new HttpTransport<EndpointTypes>({
  prepareRequests: (params, config) => {
    return params.map((param) => {
      const symbol = `${param.base}${param.quote}`.toUpperCase()
      return {
        params: [param],
        request: {
          baseURL: config.API_ENDPOINT,
          url: `/last/trade/forex/${symbol}`,
          params: { apikey: config.API_KEY },
        },
      }
    })
  },
  parseResponse: (params, res) => {
    return params.map((param) => {
      return {
        params: param,
        response: {
          data: {
            result: res.data.price,
          },
          result: res.data.price,
          timestamps: {
            providerIndicatedTime: res.data.timestamp,
          },
        },
      }
    })
  },
})

export const endpoint = new PriceEndpoint<EndpointTypes>({
  name: 'commodities',
  transport: httpTransport,
  inputParameters: inputParameters,
})
