import {
  makeLogger,
  ProviderResult,
  SingleNumberResultResponse,
} from '@chainlink/external-adapter-framework/util'
import { config } from './config'

export interface PriceRequestParams {
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

export type PriceEndpointTypes = {
  Request: {
    Params: PriceRequestParams
  }
  Response: SingleNumberResultResponse
  Settings: typeof config.settings
}

export type HttpTransportTypes = PriceEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: ResponseSchema
  }
}

const logger = makeLogger('PriceUtils')

export const buildBatchedRequestBody = <T extends PriceRequestParams>(
  params: T[],
  settings: typeof config.settings,
) => {
  return {
    params,
    request: {
      baseURL: settings.API_ENDPOINT,
      params: {
        currency: [
          ...new Set(params.map((param) => `${param.base}${param.quote ?? ''}`.toUpperCase())),
        ].join(','),
        api_key: settings.API_KEY,
      },
    },
  }
}

export const constructEntry = <T extends PriceRequestParams>(
  res: ResponseSchema,
  params: T[],
): ProviderResult<HttpTransportTypes>[] => {
  return res.quotes
    .map((entry): ProviderResult<HttpTransportTypes> | undefined => {
      const pair = params.find(
        (param) =>
          `${param.base}${param.quote ?? ''}`.toUpperCase() ===
            `${entry.base_currency}${entry.quote_currency}`.toUpperCase() ||
          `${param.base}${param.quote ?? ''}`.toUpperCase() === entry.instrument,
      )

      if (!pair) {
        logger.error(
          `No pair was found for entry (base: ${entry.base_currency}, quote: ${entry.quote_currency})`,
        )
        return undefined
      }

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
    .filter((entry) => entry !== undefined) as ProviderResult<HttpTransportTypes>[]
}
