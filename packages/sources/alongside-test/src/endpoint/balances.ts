import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { customSettings } from '../config'
import CryptoJS from 'crypto-js'
import { makeLogger } from '@chainlink/external-adapter-framework/util/logger'

const logger = makeLogger('Alongside Balances Logger')

export const inputParameters = {
  type: {
    required: true,
    description: 'The type of balance',
    type: 'string',
  },
} as const

export type RequestParams = {
  type: string
}

export type EndpointTypes = {
  Request: {
    Params: RequestParams
  }
  Response: SingleNumberResultResponse
  CustomSettings: typeof customSettings
  Provider: {
    RequestBody: never
    ResponseBody: ProviderResponseBody
  }
}

export interface ProviderResponseBody {
  balances: [
    {
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
    },
  ]
  type: string
  trading_balances: {
    total: string
    holds: string
  }
  vault_balances: {
    total: string
    holds: string
  }
}

const sign = (str: string, secret: string) => {
  const hash = CryptoJS.HmacSHA256(str, secret)
  return hash.toString(CryptoJS.enc.Base64)
}

export const httpTransport = new HttpTransport<EndpointTypes>({
  prepareRequests: (params, config) => {
    return params.map((param) => {
      const type = param.type.toUpperCase() || 'TRADING'
      const primeUrl = config.API_ENDPOINT
      const url = `${primeUrl}/portfolios/${config.PORTFOLIO_ID}/balances?balance_type=${type}_BALANCES`
      const timestamp = Math.floor(Date.now() / 1000)
      const method = 'GET'
      const path = url.replace(primeUrl, '/v1').split('?')[0]
      const message = `${timestamp}${method}${path}`
      const signature = sign(message, config.SIGNING_KEY)

      const headers = {
        'X-CB-ACCESS-KEY': config.ACCESS_KEY,
        'X-CB-ACCESS-PASSPHRASE': config.PASSPHRASE,
        'X-CB-ACCESS-SIGNATURE': signature,
        'X-CB-ACCESS-TIMESTAMP': timestamp,
        'Content-Type': 'application/json',
      }

      return {
        params,
        request: {
          baseURL: url,
          method: 'GET',
          headers,
        },
      }
    })
  },
  parseResponse(params, res) {
    if (!res.data) {
      logger.error(`The data provider didn't return any value`)
      return []
    }

    return params.map((param) => {
      const result = res.data as unknown as number
      return {
        params: { ...param },
        response: {
          data: {
            result,
          },
          result,
        },
      }
    })
  },
})
