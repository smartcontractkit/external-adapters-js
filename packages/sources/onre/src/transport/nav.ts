import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/nav'
import { parseDateToTimestamp } from './utils'

interface FundNavData {
  net_asset_value_date: string
  net_asset_value: string
  assets_under_management: string | null
  fund_name: string
  fund_id: number
}

type ProviderResponseSchema = FundNavData[]

type FundNavDataWithTimestamp = Omit<FundNavData, 'net_asset_value_date'> & {
  net_asset_value_date: number
}

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
        },
      }
    })
  },

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
        return {
          ...item,
          net_asset_value_date: parseDateToTimestamp(item.net_asset_value_date),
        }
      })

      dataWithDateMs[1].net_asset_value_date = null

      const dataWithDateMsFiltered = dataWithDateMs.filter((item) =>
        Number.isFinite(item.net_asset_value_date),
      ) as FundNavDataWithTimestamp[]
      const sortedData = dataWithDateMsFiltered.sort(
        (a, b) => b.net_asset_value_date - a.net_asset_value_date,
      )
      const latestData = sortedData[0]

      const resultData = {
        navPerShare: Number(latestData.net_asset_value),
        navDate: String(latestData.net_asset_value_date),
        currency: null,
        fundId: latestData.fund_id,
      }

      const result = Number(latestData.net_asset_value)

      return {
        params: param,
        response: {
          result: result,
          data: resultData,
        },
      }
    })
  },
})
