import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { config } from './config'
import { inputParameters } from './endpoint/live'

export interface ResponseSchema {
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

const logger = makeLogger('PriceUtils')

export const buildBatchedRequestBody = <T extends typeof inputParameters.validated>(
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

export const constructEntry = <T extends typeof inputParameters.validated>(
  res: ResponseSchema,
  params: T[],
) => {
  return params.map((param) => {
    const entry = res.quotes.find(
      (entry) =>
        `${param.base}${param.quote}`.toUpperCase() ===
          `${entry.base_currency}${entry.quote_currency}`.toUpperCase() ||
        `${param.base}${param.quote ?? ''}`.toUpperCase() === entry.instrument,
    )
    if (!entry) {
      const errorMessage = `Tradermade provided no data for ${param.base}/${param.quote}`
      logger.info(errorMessage)
      return {
        params: param,
        response: {
          errorMessage,
          statusCode: 502,
        },
      }
    } else if (entry.error) {
      const errorMessage = `Tradermade returned error ${entry.error} for ${param.base}/${param.quote}`
      logger.info(errorMessage)
      return {
        params: param,
        response: {
          errorMessage,
          statusCode: 502,
        },
      }
    } else {
      return {
        params: param,
        response: {
          data: {
            result: entry.mid,
          },
          result: entry.mid,
        },
      }
    }
  })
}
