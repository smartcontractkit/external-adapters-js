import { BaseEndpointTypes } from '../endpoint/global'
import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { makeLogger } from '@chainlink/external-adapter-framework/util/logger'

const logger = makeLogger('CoinPaprika Global Batched')

export interface GlobalResponseBody {
  market_cap_usd: number
  volume_24h_usd: number
  bitcoin_dominance_percentage: number
  cryptocurrencies_number: number
  market_cap_ath_value: number
  market_cap_ath_date: string
  volume_24h_ath_value: number
  volume_24h_ath_date: string
  market_cap_change_24h: number
  volume_24h_change_24h: number
  last_updated: number
}

export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: GlobalResponseBody
  }
}

const marketMap: { [key: string]: string } = {
  BTC: 'bitcoin',
}
export const transport = new HttpTransport<HttpTransportTypes>({
  prepareRequests: (params, settings) => {
    return {
      params,
      request: {
        baseURL: settings.API_ENDPOINT,
        url: '/v1/global',
        method: 'GET',
        headers: { Authorization: settings.API_KEY },
      },
    }
  },
  parseResponse: (params, res) => {
    const data = res.data

    return params.map((p) => {
      if (!data) {
        logger.warn(`The data provider did not send any value for this request`)
        return {
          params: p,
          response: {
            errorMessage: `The data provider did not send any value when requesting the global endpoint`,
            statusCode: 502,
          },
        }
      }

      const propertyPath =
        p.resultPath === '_dominance_percentage'
          ? `${marketMap[p.market.toUpperCase()]}${p.resultPath}`
          : `${p.resultPath}${p.market.toLowerCase()}`

      const rawResult = data[propertyPath as keyof GlobalResponseBody]
      if (!rawResult) {
        return {
          params: p,
          response: {
            errorMessage: `A value for "${propertyPath}" was not found in the provider response`,
            statusCode: 502,
          },
        }
      }

      const result = Number(rawResult)
      return {
        params: p,
        response: {
          result,
          data: {
            result,
          },
        },
      }
    })
  },
})
