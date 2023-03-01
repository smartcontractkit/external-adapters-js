import { Transport, TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import {
  AdapterRequest,
  AdapterResponse,
  SingleNumberResultResponse,
} from '@chainlink/external-adapter-framework/util'
import CryptoJS from 'crypto-js'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterConfig } from '@chainlink/external-adapter-framework/config'
import { Cache } from '@chainlink/external-adapter-framework/cache'
import { ResponseCache } from '@chainlink/external-adapter-framework/cache/response'
import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { Collateral } from './utils'
import { customSettings } from '../../config'

export type EndpointTypes = {
  Request: {
    Params: unknown
  }
  Response: SingleNumberResultResponse
  CustomSettings: typeof customSettings
  Provider: {
    RequestBody: never
    ResponseBody: ProviderResponseBody
  }
}

export interface BalanceType {
  symbol: string
  amount: number
  holds: string
  bonded_amount: string
  reserved_amount: string
  unbonding_amount: string
  unvested_amount: string
  pending_rewards_amount: string
  past_rewards_amount: string
  bondable_amount: string
  withdrawable_amount: string
}

export interface ProviderResponseBody {
  balances: BalanceType[]
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

export class AlongsideCollateralTransport implements Transport<EndpointTypes> {
  // Global variable to keep the token. Token is provisioned when the accounts endpoint is hit.
  // Each instance of the EA will have their own token by design
  token!: string
  cache!: Cache<AdapterResponse<EndpointTypes['Response']>>
  responseCache!: ResponseCache<any>
  requester!: Requester
  name!: string

  async initialize(dependencies: TransportDependencies<EndpointTypes>): Promise<void> {
    this.cache = dependencies.cache as Cache<AdapterResponse<EndpointTypes['Response']>>
    this.responseCache = dependencies.responseCache
    this.requester = dependencies.requester
    this.name = 'default_single_transport'
  }

  prepareRequest(type: string, config: AdapterConfig<typeof customSettings>) {
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
      baseURL: url,
      headers,
    }
  }

  async foregroundExecute(
    req: AdapterRequest<EndpointTypes['Request']>,
    config: AdapterConfig<typeof customSettings>,
  ): Promise<AdapterResponse<EndpointTypes['Response']>> {
    const requestTradingBalance = this.prepareRequest('TRADING', config)
    const requestTradingVault = this.prepareRequest('VAULT', config)
    const collateral = new Collateral(config.INFURA_KEY)
    const providerDataRequestedUnixMs = Date.now()
    const tradingBalances = await this.requester.request<ProviderResponseBody>(
      req.id,
      requestTradingBalance,
    )
    const vaultBalances = await this.requester.request<ProviderResponseBody>(
      req.id,
      requestTradingVault,
    )

    const units = await collateral.getAssetWeights()
    const result = collateral.calcMinCollateral(
      tradingBalances.response.data.balances,
      vaultBalances.response.data.balances,
      units,
    )

    const providerDataReceivedUnixMs = Date.now()
    const response = {
      data: {
        result: result,
      },
      statusCode: 200,
      result: result,
      timestamps: {
        providerDataRequestedUnixMs,
        providerDataReceivedUnixMs,
        providerIndicatedTimeUnixMs: undefined,
      },
    }

    await this.responseCache.write(this.name, [
      {
        params: {},
        response,
      },
    ])

    return response
  }
}

export const endpoint = new AdapterEndpoint<EndpointTypes>({
  name: 'collateral',
  transport: new AlongsideCollateralTransport(),
  inputParameters: {},
})
