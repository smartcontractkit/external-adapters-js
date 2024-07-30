import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/balance'
import { sign, getApiKeys } from './utils'

export interface ResponseSchema {
  balances: {
    symbol: string
    amount: string
    holds: string
    bonded_amount: string
    reserved_amount: string
    unbonding_amount: string
    unvested_amount: string
    pending_rewards_amount: string
    past_rewards_amount: string
    bondable_amount: string
    withdrawable_amount: string
    fiat_amount: string
  }[]
  type: string
  trading_balances: {
    total: string // Returns total in fiat amount
    holds: string
  }
  vault_balances: {
    total: string // Returns total in fiat amount
    holds: string
  }
}

export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: ResponseSchema
  }
}

export const httpTransport = new HttpTransport<HttpTransportTypes>({
  prepareRequests: (params, config) => {
    return params.map((param) => {
      const [signingKey, accessKey, passPhrase] = getApiKeys(param.apiKey, config)
      const timestamp = Math.floor(Date.now() / 1000)
      const method = 'GET'
      const path = `/v1/portfolios/${param.portfolio}/balances`
      const message = `${timestamp}${method}${path}`
      const signature = sign(message, signingKey)

      return {
        params: [param],
        request: {
          baseURL: config.API_ENDPOINT,
          url: path,
          headers: {
            'X-CB-ACCESS-KEY': accessKey,
            'X-CB-ACCESS-PASSPHRASE': passPhrase,
            'X-CB-ACCESS-SIGNATURE': signature,
            'X-CB-ACCESS-TIMESTAMP': timestamp,
            'Content-Type': 'application/json',
          },
          params: {
            symbols: param.symbol.toUpperCase(),
            balance_type: `${param.type.toUpperCase()}_BALANCES`,
          },
        },
      }
    })
  },
  parseResponse: (params, response) => {
    return params.map((param) => {
      if (!response.data) {
        return {
          params: param,
          response: {
            errorMessage: `The data provider did not return data for Portfolio: ${param.portfolio}, Balance Type: ${param.type}, Symbol: ${param.symbol}`,
            statusCode: 502,
          },
        }
      }

      if (!response.data.balances) {
        return {
          params: param,
          response: {
            errorMessage: `The data provider response does not contain a balances list for Portfolio: ${param.portfolio}, Balance Type: ${param.type}, Symbol: ${param.symbol}`,
            statusCode: 502,
          },
        }
      }

      // The adapter only supports querying one asset at a time so the balances list should only contain 1 element
      if (response.data.balances.length !== 1) {
        return {
          params: param,
          response: {
            errorMessage: `The data provider response does not contain exactly one element in the balances list for Portfolio: ${param.portfolio}, Balance Type: ${param.type}, Symbol: ${param.symbol}`,
            statusCode: 502,
          },
        }
      }

      const result = Number(response.data.balances[0].amount)
      if (isNaN(result)) {
        return {
          params: param,
          response: {
            errorMessage: `The data provider returned non-numeric balance: ${response.data.balances[0].amount}`,
            statusCode: 502,
          },
        }
      }
      return {
        params: param,
        response: {
          result: result,
          data: {
            result: result,
          },
        },
      }
    })
  },
})
