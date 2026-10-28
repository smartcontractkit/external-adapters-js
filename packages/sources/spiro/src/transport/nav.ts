import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import type { BaseEndpointTypes } from '../endpoint/nav'
import { AssetsUnderManagement } from '../endpoint/nav'
import { checkRipcord } from './utils'

export interface ResponseSchema {
  fund_id: string
  fund_name?: string
  data: ResponseSchemaEntry[]
  min_rate?: number
  max_rate?: number
  updatedAt?: string
  ripcord: boolean
  ripcordDetails: string[]
}

export interface ResponseSchemaEntry {
  fund_id: string
  net_asset_value_date: string
  net_asset_value: string
  assets_under_management: string
  outstanding_shares: string
  net_income_expenses: string
}

export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: ResponseSchema
  }
}

export const navTransport = new HttpTransport<HttpTransportTypes>({
  prepareRequests: (params, config) => {
    return params.map((param) => {
      return {
        params: [param],
        request: {
          baseURL: config.API_ENDPOINT,
          method: 'GET',
          url: `/api/chainlink/funds/${param.fundId}/nav-daily`,
          headers: {
            'x-api-key': config.API_KEY,
          },
        },
      }
    })
  },
  parseResponse: (params, res) => {
    return params.map((param) => {
      const { fundId, reportValue } = param
      const { ripcord, ripcordAsInt, message } = checkRipcord(res.data, param.noErrorOnRipcord)
      if (message) {
        return {
          params: param,
          response: {
            errorMessage: message,
            statusCode: 502,
          },
        }
      }

      if (!res.data.data?.length) {
        return {
          params: param,
          response: {
            errorMessage: `The data provider did not return any value for fundId: ${fundId}`,
            statusCode: 502,
          },
        }
      }

      const data = res.data.data.reduce((a, b) =>
        b.net_asset_value_date > a.net_asset_value_date ? b : a,
      )

      const navDateTimestampMs = Date.parse(data.net_asset_value_date)
      if (Number.isNaN(navDateTimestampMs)) {
        return {
          params: param,
          response: {
            errorMessage: `The data provider did not return a valid net_asset_value_date for fundId: ${fundId}`,
            statusCode: 502,
          },
        }
      }

      const nav = Number(data.net_asset_value)
      const aum = Number(data.assets_under_management)
      const result = reportValue === AssetsUnderManagement ? aum : nav

      return {
        params: param,
        response: {
          data: {
            result,
            nav,
            aum,
            navDate: data.net_asset_value_date,
            navDateTimestampMs,
            ripcord,
            ripcordAsInt,
          },
          result,
          statusCode: 200,
          timestamps: {
            providerIndicatedTimeUnixMs: navDateTimestampMs,
          },
        },
      }
    })
  },
})
