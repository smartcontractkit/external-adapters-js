import { AdapterConfig } from '@chainlink/external-adapter-framework/config'
import { customSettings } from './config'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'

export interface BatchRequestParams {
  base: string
  quote?: string
}
interface ResponseSchema {
  endpoint: string
  quotes: {
    ask: number
    base_currency: string
    bid: number
    mid: number
    quote_currency: string
    error?: number
    instrument?: string
    message?: string
  }[]
  requested_time: string
  timestamp: number
}

interface RequestBody {
  api_key: string
  currency: string
}

interface ResponseSchema {
  endpoint: string
  quotes: {
    ask: number
    base_currency: string
    bid: number
    mid: number
    quote_currency: string
    error?: number
    instrument?: string
    message?: string
  }[]
  requested_time: string
  timestamp: number
}

export type BatchEndpointTypes = {
  Request: {
    Params: BatchRequestParams
  }
  Response: SingleNumberResultResponse
  CustomSettings: typeof customSettings
  Provider: {
    RequestBody: RequestBody
    ResponseBody: ResponseSchema
  }
}

export const buildBatchedRequestBody = (
  params: BatchRequestParams[],
  config: AdapterConfig<typeof customSettings>,
) => {
  return {
    params,
    request: {
      baseURL: config.API_ENDPOINT,
      params: {
        currency: [
          ...new Set(params.map((param) => `${param.base}${param.quote ?? ''}`.toUpperCase())),
        ].join(','),
        api_key: config.API_KEY,
      },
    },
  }
}

export const constructEntry = (res: ResponseSchema, params: BatchRequestParams[]) => {
  return res.quotes.map((entry) => {
    if (entry.error) {
      const pair = params.find(
        (param) => `${param.base}${param.quote ?? ''}`.toUpperCase() === entry.instrument,
      ) as BatchRequestParams
      return {
        params: pair,
        response: {
          errorMessage: `No data for base - ${pair.base}, quote = ${pair.quote} `,
          statusCode: 400,
        },
      }
    }
    return {
      params: {
        base: entry.base_currency || (entry.instrument as string),
        quote: entry.quote_currency,
      },
      response: {
        data: {
          result: entry.mid,
        },
        result: entry.mid,
      },
    }
  })
}
