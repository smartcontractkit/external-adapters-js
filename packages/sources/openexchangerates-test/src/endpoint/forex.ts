import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { PriceEndpoint, PriceEndpointParams } from '@chainlink/external-adapter-framework/adapter'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { customSettings } from '../config'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { PriceEndpointInputParameters } from '@chainlink/external-adapter-framework/adapter'

interface ResponseSchema {
  disclaimer: string
  license: string
  timestamp: number
  base: string
  rates: {
    [key: string]: number
  }
}

export type ForexEndpointTypes = {
  Request: {
    Params: PriceEndpointParams
  }
  Response: SingleNumberResultResponse
  CustomSettings: typeof customSettings
  Provider: {
    RequestBody: never
    ResponseBody: ResponseSchema
  }
}

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
} satisfies InputParameters & PriceEndpointInputParameters

const getMappedSymbols = (requestParams: PriceEndpointParams[]) => {
  const symbolGroupMap: Record<string, { params: PriceEndpointParams[]; base: string }> = {}
  requestParams.forEach((param) => {
    const base = param.base.toUpperCase()

    if (!symbolGroupMap[base]) {
      symbolGroupMap[base] = {
        base,
        params: [],
      }
    }

    if (!symbolGroupMap[base].params) {
      symbolGroupMap[base].params = [param]
    } else {
      symbolGroupMap[base].params.push(param)
    }
  })

  return symbolGroupMap
}

export const batchTransport = new HttpTransport<ForexEndpointTypes>({
  prepareRequests: (params, config) => {
    // OpenExchangeRates supports batching only for base params, so we are grouping params by bases meaning we will send N number of requests to DP where the N is number of unique bases
    const groupedSymbols = getMappedSymbols(params)
    return Object.values(groupedSymbols).map((group) => {
      const { base } = group
      return {
        params: group.params,
        request: {
          url: 'latest.json',
          baseURL: config.API_ENDPOINT,
          params: {
            app_id: config.API_KEY,
            base,
          },
        },
      }
    })
  },
  parseResponse: (params, res) => {
    return params.map((param) => {
      const result = res.data.rates[param.quote.toUpperCase()]
      if (!result) {
        return {
          params: param,
          response: {
            errorMessage: `OpenExchangeRates provided no data for base "${param.base}" and quote "${param.quote}"`,
            statusCode: 502,
          },
        }
      }
      return {
        params: param,
        response: {
          data: {
            result: result,
          },
          result,
        },
      }
    })
  },
})

export const endpoint = new PriceEndpoint<ForexEndpointTypes>({
  name: 'forex',
  aliases: ['price'],
  transport: batchTransport,
  inputParameters: inputParameters,
})
