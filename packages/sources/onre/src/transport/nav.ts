import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { AssetsUnderManagement, BaseEndpointTypes, NetAssetValue } from '../endpoint/nav'

type ResultType = {
  navPerShare: number
  navDate: string
  currency: string | null
  fundId: number
}

interface ProviderResponseItem {
  net_asset_value_date: string
  net_asset_value: string
  assets_under_management: string | null
  fund_name: string
  fund_id: number
}

type ProviderResponseSchema = ProviderResponseItem[]

export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: ProviderResponseSchema
  }
}

export const httpTransport = new HttpTransport<HttpTransportTypes>({
  prepareRequests: (params, config) => {
    return params.map((param) => {
      return {
        params: [param],
        request: {
          baseURL: config.API_ENDPOINT,
          url: '/nav',
        },
      }
    })
  },

  // @ts-ignore
  parseResponse: (params, response) => {
    if (!response.data) {
      return params.map((param) => {
        return {
          params: param,
          response: {
            errorMessage: `The data provider didn't return any value for ${param}`,
            statusCode: 502,
          },
        }
      })
    }

    return params.map((param) => {
      const filteredData = response.data.filter((item) => item.fund_id === param.fundId)
      if (filteredData.length === 0) {
        return {
          params: param,
          response: {
            errorMessage: `The data provider didn't return any value for fundId: ${param.fundId}`,
            statusCode: 502,
          },
        }
      }

      const dataWithDateMs = filteredData.map((item) => {
        const [month, day, year] = item.net_asset_value_date.split('/').map(Number)
        return {
          ...item,
          net_asset_value_date: new Date(year, month - 1, day).getTime(),
        }
      })

      const sortedData = dataWithDateMs.sort(
        (a, b) => b.net_asset_value_date - a.net_asset_value_date,
      )
      const latestData = sortedData[0]

      const result_data: ResultType = {
        navPerShare: Number(latestData.net_asset_value),
        navDate: String(latestData.net_asset_value_date),
        currency: null,
        fundId: latestData.fund_id,
      }

      let result
      if (param.reportValue === NetAssetValue) {
        result = Number(latestData.net_asset_value)
      } else if (param.reportValue === AssetsUnderManagement) {
        result = Number(latestData.assets_under_management)
      }

      return {
        params: param,
        response: {
          result: result,
          data: {
            result: result_data,
          },
        },
      }
    })
  },
})
