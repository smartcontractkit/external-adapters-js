import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/forex'

export interface ResponseSchema {
  base: string
  quote: string
  data: {
    date: string
    val: number | null
    observation_datetime?: number | null
  }[]
}

export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: ResponseSchema
  }
}

export class ForexHttpTransport extends HttpTransport<HttpTransportTypes> {
  constructor() {
    super({
      prepareRequests: (params, config) => {
        return params.map((param) => {
          const base = encodeURIComponent(param.base.toUpperCase())
          const quote = encodeURIComponent(param.quote.toUpperCase())
          return {
            params: [param],
            request: {
              baseURL: config.API_ENDPOINT,
              url: `/forex/${base}/${quote}`,
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
                errorMessage: `FXMacroData returned no rate for ${param.base}/${param.quote}`,
                statusCode: 502,
              },
            }
          }

          const result = row.val
          const providerIndicatedTimeUnixMs =
            typeof row.observation_datetime === 'number'
              ? row.observation_datetime * 1000
              : new Date(`${row.date}T00:00:00Z`).getTime()

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

export const httpTransport = new ForexHttpTransport()
