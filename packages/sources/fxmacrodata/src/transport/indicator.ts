import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/indicator'

export interface ResponseSchema {
  currency: string
  indicator: string
  data: {
    date: string
    val: number | null
    announcement_datetime?: number | null
  }[]
}

export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: ResponseSchema
  }
}

export class IndicatorHttpTransport extends HttpTransport<HttpTransportTypes> {
  constructor() {
    super({
      prepareRequests: (params, config) => {
        return params.map((param) => {
          const currency = encodeURIComponent(param.currency.toUpperCase())
          const indicator = encodeURIComponent(param.indicator.toLowerCase())
          return {
            params: [param],
            request: {
              baseURL: config.API_ENDPOINT,
              url: `/announcements/${currency}/${indicator}`,
              headers: {
                'X-API-Key': config.API_KEY,
              },
              params: {
                limit: 1,
              },
            },
          }
        })
      },
      parseResponse: (params, response) => {
        return params.map((param) => {
          const row = response.data?.data
            ?.filter((r) => typeof r.val === 'number')
            .sort((a, b) => b.date.localeCompare(a.date))[0]

          if (!row || typeof row.val !== 'number') {
            return {
              params: param,
              response: {
                errorMessage: `FXMacroData returned no value for ${param.currency} ${param.indicator}`,
                statusCode: 502,
              },
            }
          }

          const result = row.val
          const providerIndicatedTimeUnixMs =
            typeof row.announcement_datetime === 'number'
              ? row.announcement_datetime * 1000
              : undefined

          return {
            params: param,
            response: {
              result,
              data: {
                result,
              },
              timestamps: {
                providerIndicatedTimeUnixMs,
              },
            },
          }
        })
      },
    })
  }
}

export const httpTransport = new IndicatorHttpTransport()
