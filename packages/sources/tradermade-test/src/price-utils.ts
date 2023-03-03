import { AdapterConfig } from '@chainlink/external-adapter-framework/config'
import { customSettings } from './config'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'

export type BatchRequestParams = LiveRequestParams

export interface LiveRequestParams {
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

export type BatchEndpointTypes = LiveEndpointTypes & {
  Request: {
    Params: BatchRequestParams
  }
}

export type LiveEndpointTypes = {
  Request: {
    Params: LiveRequestParams
  }
  Response: SingleNumberResultResponse
  CustomSettings: typeof customSettings
  Provider: {
    RequestBody: never
    ResponseBody: ResponseSchema
  }
}

export const buildBatchedRequestBody = <T extends LiveRequestParams>(
  params: T[],
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

export const constructEntry = <T extends LiveRequestParams>(res: ResponseSchema, params: T[]) => {
  return res.quotes.map((entry) => {
    const pair = params.find(
      (param) =>
        `${param.base}${param.quote ?? ''}`.toUpperCase() ===
          `${entry.base_currency}${entry.quote_currency}`.toUpperCase() ||
        `${param.base}${param.quote ?? ''}`.toUpperCase() === entry.instrument,
    ) as unknown as BatchRequestParams

    if (entry.error) {
      return {
        params: pair,
        response: {
          errorMessage: `No data for base - ${pair.base}, quote - ${pair.quote} `,
          statusCode: 502,
        },
      }
    }
    return {
      params: pair,
      response: {
        data: {
          result: entry.mid,
        },
        result: entry.mid,
      },
    }
  })
}
