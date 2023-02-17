import { Transport, TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import {
  AdapterRequest,
  AdapterResponse,
  SingleNumberResultResponse,
  sleep,
} from '@chainlink/external-adapter-framework/util'
import CryptoJS from 'crypto-js'
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import { makeLogger } from '@chainlink/external-adapter-framework/util/logger'
import { AdapterConfig } from '@chainlink/external-adapter-framework/config'
import { Cache } from '@chainlink/external-adapter-framework/cache'
import { ResponseCache } from '@chainlink/external-adapter-framework/cache/response'
import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { Collateral } from './utils'
import { customSettings } from '../../config'

const logger = makeLogger('Alongside Colateral endpoint Logger')

const MS_BETWEEN_FAILED_REQS = 400

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

  async initialize(dependencies: TransportDependencies<EndpointTypes>): Promise<void> {
    this.cache = dependencies.cache as Cache<AdapterResponse<EndpointTypes['Response']>>
    this.responseCache = dependencies.responseCache
  }

  prepareRequest(type: string, config: AdapterConfig<typeof customSettings>): AxiosRequestConfig {
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

  async makeRequest(
    axiosRequest: AxiosRequestConfig,
    config: AdapterConfig<typeof customSettings>,
  ): Promise<AxiosResponse<ProviderResponseBody>> {
    let retryNumber = 0
    let response = await this._makeRequest(axiosRequest)
    while (response.status !== 200) {
      retryNumber++
      logger.warn(
        'Encountered error when fetching data from alongside:',
        response.status,
        response.statusText,
      )

      if (retryNumber === config.RETRY) {
        throw new AdapterError({
          statusCode: 504,
          message: `Alongside transport hit the max number of retries (${config.RETRY} retries) and aborted`,
        })
      }

      logger.debug(`Sleeping for ${MS_BETWEEN_FAILED_REQS}ms before retrying`)
      await sleep(MS_BETWEEN_FAILED_REQS)
      response = await this._makeRequest(axiosRequest)
    }
    return response
  }

  async foregroundExecute(
    req: AdapterRequest<EndpointTypes['Request']>,
    config: AdapterConfig<typeof customSettings>,
  ): Promise<AdapterResponse<EndpointTypes['Response']>> {
    const requestTradingBalance = this.prepareRequest('TRADING', config)
    const requestTradingVault = this.prepareRequest('VAULT', config)
    const collateral = new Collateral(config.INFURA_KEY)
    const providerDataRequestedUnixMs = Date.now()
    const tradingBalances = await this.makeRequest(requestTradingBalance, config)
    const vaultBalances = await this.makeRequest(requestTradingVault, config)
    const units = await collateral.getAssetWeights()
    const result = collateral.calcMinCollateral(
      tradingBalances.data.balances,
      vaultBalances.data.balances,
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
    await this.cache.set(req.requestContext.cacheKey, response, config.CACHE_MAX_AGE)
    return response
  }

  private async _makeRequest(axiosRequest: AxiosRequestConfig): Promise<AxiosResponse> {
    try {
      return await axios.request(axiosRequest)
    } catch (e) {
      return e as AxiosResponse
    }
  }
}

export const endpoint = new AdapterEndpoint<EndpointTypes>({
  name: 'collateral',
  transport: new AlongsideCollateralTransport(),
  inputParameters: {},
})
