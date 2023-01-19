import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { customSettings } from '../../config'

export const inputParameters = {
  base: {
    aliases: ['from', 'coin'],
    required: true,
    type: 'string',
    description: 'The symbol of the currency to query',
  },
} as const

interface RequestParams {
  base: string
}

interface ResponseSchema {
  symbol: string
  totalResults: number
  error?: string
  results: [
    {
      o: number
      h: number
      l: number
      c: number
      v: number
      t: number
    },
  ]
}

type EndpointTypes = {
  Request: {
    Params: RequestParams
  }
  Response: SingleNumberResultResponse
  CustomSettings: typeof customSettings
  Provider: {
    RequestBody: never
    ResponseBody: ResponseSchema
  }
}

export const httpTransport = new HttpTransport<EndpointTypes>({
  prepareRequests: (params, config) => {
    return params.map((param) => {
      return {
        params: [param],
        request: {
          baseURL: config.API_ENDPOINT,
          url: `/agg/stock/prev-close/${param.base}`,
          params: { apikey: config.API_KEY },
        },
      }
    })
  },
  parseResponse: (params, res) => {
    if (res.data.error) {
      return params.map((param) => {
        return {
          params: param,
          response: {
            errorMessage:
              'Could not retrieve valid data from Data Provider. This is likely an issue with the Data Provider or the input params/overrides',
            statusCode: 400,
          },
        }
      })
    }

    return params.map((param) => {
      return {
        params: param,
        response: {
          data: {
            result: res.data.results[0].c,
          },
          result: res.data.results[0].c,
          timestamps: {
            providerIndicatedTimeUnixMs: res.data.results[0].t,
          },
        },
      }
    })
  },
})

export const endpoint = new AdapterEndpoint<EndpointTypes>({
  name: 'eod',
  transport: httpTransport,
  inputParameters: inputParameters,
})
