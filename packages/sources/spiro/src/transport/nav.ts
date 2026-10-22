import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { AssetsUnderManagement } from '../endpoint/nav' // FRAMEWORK-EXCEPTION: SPIRO-4
import type { BaseEndpointTypes } from '../endpoint/nav'
import { checkRipcord } from './utils' // FRAMEWORK-EXCEPTION: SPIRO-5

// FRAMEWORK-EXCEPTION-BEGIN: SPIRO-4
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
// FRAMEWORK-EXCEPTION-END: SPIRO-4

export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: ResponseSchema
  }
}

export const navTransport = new HttpTransport<HttpTransportTypes>({ // FRAMEWORK-EXCEPTION: SPIRO-4
  prepareRequests: (params, config) => {
    return params.map((param) => {
      return {
        params: [param],
        // FRAMEWORK-EXCEPTION-BEGIN: SPIRO-4
        request: {
          baseURL: config.API_ENDPOINT,
          method: 'GET',
          url: `/api/chainlink/funds/${param.fundId}/nav-daily`,
          headers: {
            'x-api-key': config.API_KEY,
          },
        },
        // FRAMEWORK-EXCEPTION-END: SPIRO-4
      }
    })
  },
  parseResponse: (params, res) => {
    return params.map((param) => {
      const { fundId, reportValue } = param // FRAMEWORK-EXCEPTION: SPIRO-4
      const { ripcord, ripcordAsInt, message } = checkRipcord(res.data, param.noErrorOnRipcord ?? false) // FRAMEWORK-EXCEPTION: SPIRO-5
      if (message) { // FRAMEWORK-EXCEPTION: SPIRO-5
        return {
          params: param,
          response: {
            errorMessage: message,
            statusCode: 502,
          },
        }
      }

      if (!res.data.data?.length) { // FRAMEWORK-EXCEPTION: SPIRO-4
        return {
          params: param,
          response: {
            errorMessage: `The data provider did not return any value for fundId: ${fundId}`,
            statusCode: 502,
          },
        }
      }

      const data = res.data.data.reduce((a, b) => (b.net_asset_value_date > a.net_asset_value_date ? b : a)) // FRAMEWORK-EXCEPTION: SPIRO-2

      const navDateTimestampMs = Date.parse(data.net_asset_value_date) // FRAMEWORK-EXCEPTION: SPIRO-3
      if (Number.isNaN(navDateTimestampMs)) { // FRAMEWORK-EXCEPTION: SPIRO-3
        return {
          params: param,
          response: {
            errorMessage: `The data provider did not return a valid net_asset_value_date for fundId: ${fundId}`, // FRAMEWORK-EXCEPTION: SPIRO-3
            statusCode: 502,
          },
        }
      }

      const nav = Number(data.net_asset_value) // FRAMEWORK-EXCEPTION: SPIRO-1
      const aum = Number(data.assets_under_management) // FRAMEWORK-EXCEPTION: SPIRO-1
      const result = reportValue === AssetsUnderManagement ? aum : nav // FRAMEWORK-EXCEPTION: SPIRO-1

      return {
        params: param,
        response: {
          data: {
            result,
            nav, // FRAMEWORK-EXCEPTION: SPIRO-4
            aum, // FRAMEWORK-EXCEPTION: SPIRO-4
            navDate: data.net_asset_value_date, // FRAMEWORK-EXCEPTION: SPIRO-4
            navDateTimestampMs, // FRAMEWORK-EXCEPTION: SPIRO-4
            ripcord,
            ripcordAsInt,
          },
          result,
          statusCode: 200,
          timestamps: {
            providerIndicatedTimeUnixMs: navDateTimestampMs, // FRAMEWORK-EXCEPTION: SPIRO-3
          },
        },
      }
    })
  },
})
