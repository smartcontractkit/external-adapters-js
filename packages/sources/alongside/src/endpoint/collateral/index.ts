import { AdapterEndpoint, EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { ResponseCache } from '@chainlink/external-adapter-framework/cache/response'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import {
  makeLogger,
  SingleNumberResultResponse,
  sleep,
} from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import CryptoJS from 'crypto-js'
import { config } from '../../config'
import { Collateral } from './utils'

const logger = makeLogger('AlongsideLogger')

export type EndpointTypes = {
  Request: {
    Params: unknown
  }
  Response: SingleNumberResultResponse
  Settings: typeof config.settings
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

export class AlongsideCollateralTransport extends SubscriptionTransport<EndpointTypes> {
  responseCache!: ResponseCache<{
    Request: EndpointTypes['Request']
    Response: EndpointTypes['Response']
  }>
  requester!: Requester
  name!: string

  async initialize(
    dependencies: TransportDependencies<EndpointTypes>,
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

  async backgroundHandler(context: EndpointContext<EndpointTypes>): Promise<void> {
    const collateral = new Collateral(context.adapterSettings.RPC_URL)
    const providerDataRequestedUnixMs = Date.now()

    try {
      const { tradingBalances, vaultBalances } = await this.fetchBalances(context.adapterSettings)
      const units = await this.getAssetWeights(collateral)
      const result = await this.calculateMinimumCollateral(
        collateral,
        tradingBalances,
        vaultBalances,
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
    } catch (e) {
      if (e instanceof Error) {
        await this.handleErrorResponse(e.message, providerDataRequestedUnixMs)
      } else {
        logger.error(JSON.stringify(e))
        await this.handleErrorResponse('Unknown error occurred', providerDataRequestedUnixMs)
      }
    }

    await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS)
    return
  }

  async fetchBalances(adapterSettings: typeof config.settings): Promise<{
    tradingBalances: ProviderResponseBody
    vaultBalances: ProviderResponseBody
  }> {
    let tradingBalances!: ProviderResponseBody
    let vaultBalances!: ProviderResponseBody

    logger.debug('Preparing request for trading balance')
    const requestTradingBalance = this.prepareRequest('TRADING', adapterSettings)
    logger.debug('Preparing request for vault balance')
    const requestTradingVault = this.prepareRequest('VAULT', adapterSettings)

    logger.debug('Requesting trading balance')
    const tradingBalancePromise = this.requester
      .request<ProviderResponseBody>('trading_balance_request', requestTradingBalance)
      .then(
        (value) => {
          tradingBalances = value.response.data
        },
        (reason) => {
          logger.error(JSON.stringify(reason))
          throw Error('Error occurred retrieving trading balance')
        },
      )

    logger.debug('Requesting trading vault')
    const vaultBalancePromise = this.requester
      .request<ProviderResponseBody>('vault_balance_request', requestTradingVault)
      .then(
        (value) => {
          vaultBalances = value.response.data
        },
        (reason) => {
          logger.error(JSON.stringify(reason))
          throw Error('Error occurred retrieving trading balance')
        },
      )

    await Promise.all([tradingBalancePromise, vaultBalancePromise])

    return { tradingBalances, vaultBalances }
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

  async handleErrorResponse(
    errorMessage: string,
    providerDataRequestedUnixMs: number,
  ): Promise<void> {
    logger.error(errorMessage)
    await this.responseCache.write(this.name, [
      {
        params: {},
        response: {
          statusCode: 502,
          errorMessage,
          timestamps: {
            providerDataRequestedUnixMs,
            providerDataReceivedUnixMs: Date.now(),
            providerIndicatedTimeUnixMs: undefined,
          },
        },
      },
    ])
  }
}

export const endpoint = new AdapterEndpoint<EndpointTypes>({
  name: 'collateral',
  transport: new AlongsideCollateralTransport(),
  inputParameters: {},
})
