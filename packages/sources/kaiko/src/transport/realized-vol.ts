import { BaseEndpointTypes, ResponseData } from '../endpoint/realized-vol'
import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { makeLogger } from '@chainlink/external-adapter-framework/util'

const logger = makeLogger('Kaiko RealizedVol HTTP')

interface ProviderResponseBody {
  query: {
    start_time: Date
    end_time: Date
    parameters_code: string
    request_time: Date
    commodity: string
    data_version: string
  }
  data: {
    [key: string]: {
      pair: string
      lookback_window: string
      returns_frequency: string
      realized_volatilities: {
        datetime: Date
        value: number
      }[]
    }
  }
}

const TEN_MINS_MS = 600_000
const DEFAULT_FREQUENCY = '10m'
const REALIZED_VOL_URL = `analytics.v2/realized_volatility`
const LOOKBACK_WINDOWS = ['1d', '7d', '30d'] as const
type LookbackWindow = (typeof LOOKBACK_WINDOWS)[number]

export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: unknown
    ResponseBody: ProviderResponseBody
  }
}

const computeStartTime = (endTime: Date) => new Date(endTime.getTime() - TEN_MINS_MS)

// example parameter_code format: 'btc-usd:1d_10m,btc-usd:7d_10m,btc-usd:30d_10m',
const constructAssetCode = (
  base: string,
  quote: string,
  lookback: LookbackWindow,
  frequency = DEFAULT_FREQUENCY,
) => `${base.toLowerCase()}-${quote.toLowerCase()}:${lookback}_${frequency}`

export const transport = new HttpTransport<HttpTransportTypes>({
  prepareRequests: (params, config) => {
    const endTime = new Date()
    const startTime = computeStartTime(endTime)

    return params.map((param) => {
      const assetCodes = LOOKBACK_WINDOWS.map((lookback) =>
        constructAssetCode(param.base, param.quote, lookback),
      ).join(',')
      return {
        params: [param],
        request: {
          baseURL: config.BASE_API_ENDPOINT,
          url: REALIZED_VOL_URL,
          headers: {
            'X-Api-Key': config.API_KEY,
            Accept: 'application/json',
          },
          params: {
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            parameters_code: assetCodes,
          },
        },
      }
    })
  },

  parseResponse: (params, res) => {
    // If no data is returned, return an error. Empty response is usually due to invalid currency pair or invalid API key (or key doesn't have access to the endpoint)
    if (!res?.data?.data) {
      return params.map((param) => {
        const errorMessage = `Kaiko provided no realized volatility data for ${param.base}/${param.quote}`
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

    return params.map((entry) => {
      const assetData = res.data.data
      const realVol1DayData = assetData[constructAssetCode(entry.base, entry.quote, '1d')]
      const realVol7DayData = assetData[constructAssetCode(entry.base, entry.quote, '7d')]
      const realVol30DayData = assetData[constructAssetCode(entry.base, entry.quote, '30d')]

      // take last entry in array because it is asc ordered (earliest to most recent)
      const realVol1Day =
        realVol1DayData.realized_volatilities[realVol1DayData.realized_volatilities.length - 1]
      const realVol7Day =
        realVol7DayData.realized_volatilities[realVol7DayData.realized_volatilities.length - 1]
      const realVol30Day =
        realVol30DayData.realized_volatilities[realVol30DayData.realized_volatilities.length - 1]

      const data: ResponseData = {
        realVol1Day: realVol1Day.value,
        realVol7Day: realVol7Day.value,
        realVol30Day: realVol30Day.value,
      }
      const dates = {
        realVol1Day: realVol1Day.datetime,
        realVol7Day: realVol7Day.datetime,
        realVol30Day: realVol30Day.datetime,
      }

      return {
        params: entry,
        response: {
          data: data,
          result: data[entry.resultPath] ? data[entry.resultPath] : null,
          timestamps: {
            providerIndicatedTimeUnixMs: new Date(dates[entry.resultPath]).getTime(),
          },
        },
      }
    })
  },
})
