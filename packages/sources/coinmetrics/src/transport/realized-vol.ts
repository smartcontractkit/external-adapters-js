import { BaseEndpointTypes, ResponseData } from '../endpoint/realized-vol'
import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { makeLogger } from '@chainlink/external-adapter-framework/util'

const logger = makeLogger('Coinmetrics RealizedVol HTTP')

interface RealizedVolResponseBody {
  data: (Record<string, string> & {
    asset: string
    time: string // DateTime (e.g. '2022-12-08T23:50:00.000000000Z')
  })[]
}

const LOOKBACK_WINDOWS = ['24h', '7d', '30d'] as const
type LookbackWindow = (typeof LOOKBACK_WINDOWS)[number]

const constructLookbackMetric = (quote: string, lookback: LookbackWindow) =>
  `volatility_realized_${quote}_rolling_${lookback}`.toLowerCase()

export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: undefined
    ResponseBody: RealizedVolResponseBody
  }
}

export const transport = new HttpTransport<HttpTransportTypes>({
  prepareRequests: (params, config) => {
    return params.map((param) => {
      return {
        params: [param],
        request: {
          baseURL: config.API_ENDPOINT,
          url: 'timeseries/asset-metrics',
          params: {
            api_key: config.API_KEY,
            assets: param.base,
            metrics: LOOKBACK_WINDOWS.map((lookback) =>
              constructLookbackMetric(param.quote, lookback),
            ).join(','),
            limit_per_asset: 1,
            frequency: '10m',
          },
        },
      }
    })
  },

  parseResponse: (params, res) => {
    // If no data is returned, return an error. Empty response is usually due to invalid currency pair or invalid API key (or key doesn't have access to the endpoint)
    if (!res?.data?.data.length) {
      return params.map((param) => {
        const errorMessage = `Coinmetrics provided no Realized Volatility data for ${param.base}/${param.quote}`
        logger.warn(errorMessage)
        return {
          params: param,
          response: {
            errorMessage: errorMessage,
            statusCode: 502,
          },
        }
      })
    }

    return params.map((param) => {
      const realizedVolData = res.data.data[0]

      const data: ResponseData = {
        realVol1Day: Number(realizedVolData[constructLookbackMetric(param.quote, '24h')]),
        realVol7Day: Number(realizedVolData[constructLookbackMetric(param.quote, '7d')]),
        realVol30Day: Number(realizedVolData[constructLookbackMetric(param.quote, '30d')]),
      }

      return {
        params: param,
        response: {
          data,
          result: data[param.resultPath] ? data[param.resultPath] : null,
          timestamps: {
            providerIndicatedTimeUnixMs: new Date(realizedVolData.time).getTime(),
          },
        },
      }
    })
  },
})
