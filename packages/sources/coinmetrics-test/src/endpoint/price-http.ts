import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { ProviderResult } from '@chainlink/external-adapter-framework/util'
import { VALID_QUOTES } from '../config'
import { AssetMetricsEndpointTypes } from './price'

export type MetricData = {
  asset: string
  time: string
  ReferenceRateUSD?: string
  ReferenceRateEUR?: string
  ReferenceRateETH?: string
  ReferenceRateBTC?: string
}

interface ResponseSchema {
  data: MetricData[]
  error?: {
    type: string
    message: string
  }
}

type AssetMetricsHttpTypes = AssetMetricsEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: ResponseSchema
  }
}

export const httpTransport = new HttpTransport<AssetMetricsHttpTypes>({
  prepareRequests: (params, config) => {
    return {
      params,
      request: {
        baseURL: config.API_ENDPOINT,
        url: `timeseries/asset-metrics`,
        params: {
          assets: [...new Set(params.map((p) => p.base.toUpperCase()))].join(','),
          metrics: [...new Set(params.map((p) => `ReferenceRate${p.quote.toUpperCase()}`))].join(
            ',',
          ),
          frequency: '1s',
          api_key: config.API_KEY,
          limit_per_asset: 1,
        },
      },
    }
  },
  parseResponse: (params, res) => {
    if (res.data.error) {
      return params.map((param) => {
        return {
          params: param,
          response: {
            errorMessage:
              res.data.error?.message ||
              'Could not retrieve valid data from Data Provider. This is likely an issue with the Data Provider or the input params/overrides',
            statusCode: 400,
          },
        }
      })
    }

    const entries: ProviderResult<AssetMetricsHttpTypes>[] = []

    res.data.data.map((entry) => {
      for (const prop in entry) {
        if (prop.includes('ReferenceRate')) {
          const result = Number(entry[prop as keyof MetricData])
          const quote = prop.replace('ReferenceRate', '') as VALID_QUOTES
          entries.push({
            params: { base: entry.asset.toUpperCase(), quote },
            response: {
              data: {
                result,
              },
              result,
            },
          })
        }
      }
    })

    return entries
  },
})
