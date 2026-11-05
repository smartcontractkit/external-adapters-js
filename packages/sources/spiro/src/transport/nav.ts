import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import type { BaseEndpointTypes } from '../endpoint/nav'
import { checkRipcord, parseDateMs, parseNumber, ProviderDataError } from './utils'

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
    return params.map((param) => ({
      params: [param],
      request: {
        baseURL: config.API_ENDPOINT,
        method: 'GET',
        url: `/${param.fundId}/nav-daily`,
        headers: {
          'x-api-key': config.API_KEY,
        },
      },
    }))
  },
  parseResponse: (params, res) => {
    return params.map((param) => {
      try {
        const { ripcord, ripcordAsInt } = checkRipcord(res.data)
        if (!Array.isArray(res.data.data) || res.data.data.length === 0) {
          throw new ProviderDataError(
            `The data provider did not return any NAV entries for fundId: ${param.fundId}`,
          )
        }
        if (!res.data.data.every((entry) => entry && typeof entry === 'object')) {
          throw new ProviderDataError(
            `The data provider returned an invalid NAV entry for fundId: ${param.fundId}`,
          )
        }
        const entries = res.data.data.map((entry) => ({
          ...entry,
          dateMs: parseDateMs(entry.net_asset_value_date),
        }))
        const latest = entries.reduce((a, b) => (b.dateMs > a.dateMs ? b : a))
        const nav = parseNumber(latest.net_asset_value, 'net_asset_value')
        const aum = parseNumber(latest.assets_under_management, 'assets_under_management')

        return {
          params: param,
          response: {
            data: {
              result: nav,
              nav,
              aum,
              ripcord,
              ripcordAsInt,
            },
            result: nav,
            statusCode: 200,
            timestamps: {
              providerIndicatedTimeUnixMs: latest.dateMs,
            },
          },
        }
      } catch (error) {
        if (error instanceof ProviderDataError) {
          return {
            params: param,
            response: { errorMessage: error.message, statusCode: 502 },
          }
        }
        throw error
      }
    })
  },
})
