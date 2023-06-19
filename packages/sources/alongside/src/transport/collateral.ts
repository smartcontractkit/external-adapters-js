import { BaseEndpointTypes } from '../endpoint/collateral'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { ResponseCache } from '@chainlink/external-adapter-framework/cache/response'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { config } from '../config'
import { Collateral, sign } from './utils'
import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { makeLogger } from '@chainlink/external-adapter-framework/util/logger'
import { AdapterResponse, sleep } from '@chainlink/external-adapter-framework/util'

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

const logger = makeLogger('AlongsideLogger')

export type CollateralTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: ProviderResponseBody
  }
}
export class AlongsideCollateralTransport extends SubscriptionTransport<CollateralTransportTypes> {
  responseCache!: ResponseCache<CollateralTransportTypes>
  requester!: Requester
  name!: string

  async initialize(
    dependencies: TransportDependencies<CollateralTransportTypes>,
    adapterSettings: typeof config.settings,
    endpointName: string,
    name: string,
  ): Promise<void> {
    super.initialize(dependencies, adapterSettings, endpointName, name)
    this.responseCache = dependencies.responseCache
    this.requester = dependencies.requester
    this.name = name
  }

  getSubscriptionTtlFromConfig(adapterSettings: typeof config.settings): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }

  prepareRequest(type: string, settings: typeof config.settings) {
    const primeUrl = settings.API_ENDPOINT
    const url = `${primeUrl}/portfolios/${settings.PORTFOLIO_ID}/balances?balance_type=${type}_BALANCES`
    const timestamp = Math.floor(Date.now() / 1000)
    const method = 'GET'
    const path = url.replace(primeUrl, '/v1').split('?')[0]
    const message = `${timestamp}${method}${path}`
    const signature = sign(message, settings.SIGNING_KEY)

    const headers = {
      'X-CB-ACCESS-KEY': settings.ACCESS_KEY,
      'X-CB-ACCESS-PASSPHRASE': settings.PASSPHRASE,
      'X-CB-ACCESS-SIGNATURE': signature,
      'X-CB-ACCESS-TIMESTAMP': timestamp,
      'Content-Type': 'application/json',
    }

    return {
      baseURL: url,
      headers,
    }
  }

  async backgroundHandler(context: EndpointContext<CollateralTransportTypes>): Promise<void> {
    const collateral = new Collateral(context.adapterSettings.RPC_URL)
    const providerDataRequestedUnixMs = Date.now()
    logger.debug('Preparing request for trading balance')
    const tradingBalanceRequest = this.prepareRequest('TRADING', context.adapterSettings)
    logger.debug('Preparing request for vault balance')
    const tradingVaultRequest = this.prepareRequest('VAULT', context.adapterSettings)
    let response: AdapterResponse<CollateralTransportTypes['Response']>

    try {
      // Initiate trading balance, vault balance, and asset weight requests in parallel
      const [tradingBalanceResponse, vaultBalanceResponse, units] = await Promise.all([
        this.requester.request<ProviderResponseBody>('balance_request', tradingBalanceRequest),
        this.requester.request<ProviderResponseBody>('vault_request', tradingVaultRequest),
        this.getAssetWeights(collateral),
      ])
      // Calculate minimum collateral with results from above requests
      const result = await this.calculateMinimumCollateral(
        collateral,
        tradingBalanceResponse.response.data,
        vaultBalanceResponse.response.data,
        units,
      )
      response = {
        data: {
          result: result,
        },
        statusCode: 200,
        result: result,
        timestamps: {
          providerDataRequestedUnixMs,
          providerDataReceivedUnixMs: Date.now(),
          providerIndicatedTimeUnixMs: undefined,
        },
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred'
      logger.error(errorMessage)
      response = {
        statusCode: 502,
        errorMessage,
        timestamps: {
          providerDataRequestedUnixMs,
          providerDataReceivedUnixMs: Date.now(),
          providerIndicatedTimeUnixMs: undefined,
        },
      }
    }

    await this.responseCache.write(this.name, [
      {
        params: {},
        response,
      },
    ])

    await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS)
    return
  }

  async getAssetWeights(collateral: Collateral): Promise<{ [k: string]: number }> {
    try {
      logger.debug('Getting asset weights')
      return await collateral.getAssetWeights()
    } catch (e) {
      throw Error('Error occurred retrieving asset weights')
    }
  }

  async calculateMinimumCollateral(
    collateral: Collateral,
    tradingBalances: ProviderResponseBody,
    vaultBalances: ProviderResponseBody,
    units: Record<string, number>,
  ): Promise<number> {
    try {
      logger.debug('Calculating minimum collateral')
      return collateral.calcMinCollateral(tradingBalances.balances, vaultBalances.balances, units)
    } catch (e) {
      throw Error('Error occurred calculating minimum collateral')
    }
  }
}
