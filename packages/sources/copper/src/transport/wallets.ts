import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { calculateHttpRequestKey } from '@chainlink/external-adapter-framework/cache'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { BaseEndpointTypes, inputParameters } from '../endpoint/wallets'

import { ethers } from 'ethers'
import { GroupedProvider, OraclePriceType, signRequest, toBigIntBalance, toEvenHex } from './utils'

const logger = makeLogger('Copper - Wallets')

type RequestParams = typeof inputParameters.validated

const RESULT_DECIMALS = 18
const path = '/platform/wallets'

// type PriceOraclesTypes = {
//   token: string
//   contractAddress: string
//   chainId: string
// }

type RequestContext = {
  groupedProviders: {
    [chainId: string]: GroupedProvider
  }
}

export interface WalletResponseSchema {
  walletId: string
  portfolioId: string
  currency: string
  mainCurrency: string
  balance: string
  stakeBalance: string
  totalBalance: string
  [key: string]: any
}

export class WalletsTransport extends SubscriptionTransport<BaseEndpointTypes> {
  config!: BaseEndpointTypes['Settings']
  endpointName!: string
  requester!: Requester
  ethProvider!: ethers.providers.JsonRpcProvider
  arbProvider!: ethers.providers.JsonRpcProvider

  // private providers: Record<string, ethers.providers.JsonRpcProvider> = {}

  async initialize(
    dependencies: TransportDependencies<BaseEndpointTypes>,
    adapterSettings: BaseEndpointTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this.config = adapterSettings
    this.endpointName = endpointName
    this.requester = dependencies.requester

    if (!adapterSettings.ARBITRUM_RPC_URL) {
      logger.error('ARBITRUM_RPC_URL is missing')
    } else {
      this.arbProvider = new ethers.providers.JsonRpcProvider(
        adapterSettings.ARBITRUM_RPC_URL,
        Number(adapterSettings.ARBITRUM_RPC_CHAIN_ID),
      )
    }

    if (!adapterSettings.ETHEREUM_RPC_URL) {
      logger.error('ETHEREUM_RPC_URL is missing')
    } else {
      this.ethProvider = new ethers.providers.JsonRpcProvider(
        adapterSettings.ETHEREUM_RPC_URL,
        Number(adapterSettings.ETHEREUM_RPC_CHAIN_ID),
      )
    }

    // if (adapterSettings.ETHEREUM_RPC_URL) {
    //   this.providers["ETHEREUM"] = new ethers.providers.JsonRpcProvider(adapterSettings.ETHEREUM_RPC_URL)
    // } else {
    //   logger.warn("Environment variable ETHEREUM_RPC_URL is missing")
    // }

    // if (adapterSettings.ARBITRUM_RPC_URL) {
    //   this.providers["ARBITRUM"] = new ethers.providers.JsonRpcProvider(adapterSettings.ARBITRUM_RPC_URL)
    // } else {
    //   logger.warn("Environment variable ARBITRUM_RPC_URL is missing")
    // }
  }

  async backgroundHandler(context: EndpointContext<BaseEndpointTypes>, entries: RequestParams[]) {
    await Promise.all(entries.map(async (param) => this.handleRequest(context, param)))
    await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS)
  }

  async handleRequest(_context: EndpointContext<BaseEndpointTypes>, param: RequestParams) {
    let response: AdapterResponse<BaseEndpointTypes['Response']>
    const requestContext: RequestContext = {
      groupedProviders: {},
    }
    try {
      response = await this._handleRequest(_context, param, requestContext)
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred'
      logger.error(e, errorMessage)
      response = {
        statusCode: (e as AdapterInputError)?.statusCode || 502,
        errorMessage,
        timestamps: {
          providerDataRequestedUnixMs: 0,
          providerDataReceivedUnixMs: 0,
          providerIndicatedTimeUnixMs: undefined,
        },
      }
    }
    await this.responseCache.write(this.name, [{ params: param, response }])
  }

  async _handleRequest(
    config: EndpointContext<BaseEndpointTypes>,
    param: RequestParams,
    requestContext: RequestContext,
  ): Promise<AdapterResponse<BaseEndpointTypes['Response']>> {
    const providerDataRequestedUnixMs = Date.now()

    const balances = await this.getAggregatedWalletBalance(config, param)
    const priceData = await this.getPriceData(config, param, requestContext)
    const usdValues = await this.computeUsdValue(balances, priceData)

    // Sum all USD values to get total portfolio value
    const totalUsdValue = Object.values(usdValues).reduce((acc, val) => acc + val.value, 0n)
    const totalUsdValueInHex = toEvenHex(totalUsdValue)

    return {
      data: {
        totalUsdValue: totalUsdValue.toString(),
        decimal: RESULT_DECIMALS,
        totalUsdValueInHex: totalUsdValueInHex,
      },
      statusCode: 200,
      result: totalUsdValueInHex,
      timestamps: {
        providerDataRequestedUnixMs,
        providerDataReceivedUnixMs: Date.now(),
        providerIndicatedTimeUnixMs: undefined,
      },
    }
  }

  getGroupedProvider(
    context: EndpointContext<BaseEndpointTypes>,
    chainId: string,
    requestContext: RequestContext,
  ): GroupedProvider {
    let provider!: ethers.providers.JsonRpcProvider
    if (chainId === String(context.adapterSettings.ETHEREUM_RPC_CHAIN_ID)) {
      provider = this.ethProvider
    } else if (chainId === String(context.adapterSettings.ARBITRUM_RPC_CHAIN_ID)) {
      provider = this.arbProvider
    } else {
      throw new AdapterInputError({
        statusCode: 400,
        message: `ChainId ${chainId} not supported.`,
      })
    }

    if (!requestContext.groupedProviders[chainId]) {
      requestContext.groupedProviders[chainId] = new GroupedProvider(
        provider,
        context.adapterSettings.GROUP_SIZE,
      )
    }
    return requestContext.groupedProviders[chainId]
  }

  async getWalletBalance(
    config: EndpointContext<BaseEndpointTypes>,
    param: RequestParams,
  ): Promise<WalletResponseSchema> {
    const parameters: Record<string, string> = {}

    if (param.portfolioId) {
      parameters.portfolioId = param.portfolioId
    }
    if (param.currencies && param.currencies.length > 0) {
      parameters.currencies = param.currencies.join(',')
    }

    const requestConfig = {
      baseURL: config.adapterSettings.API_ENDPOINT,
      url: path,
      method: 'GET',
      data: '',
      headers: signRequest(
        'GET',
        path,
        '',
        config.adapterSettings.API_KEY,
        config.adapterSettings.API_SECRET,
        parameters,
      ),
      params: parameters,
    }

    const result = await this.requester.request<WalletResponseSchema>(
      calculateHttpRequestKey<BaseEndpointTypes>({
        context: {
          adapterSettings: this.config,
          inputParameters,
          endpointName: this.endpointName,
        },
        data: {},
        transportName: this.name,
      }),
      requestConfig,
    )

    return result.response.data
  }

  async getAggregatedWalletBalance(
    config: EndpointContext<BaseEndpointTypes>,
    param: RequestParams,
  ): Promise<Record<string, { value: bigint; decimals: number }>> {
    const data = await this.getWalletBalance(config, param)

    const aggregatedBalances: Record<string, { value: bigint; decimals: number }> = {}

    for (const wallet of data.wallets) {
      const curr = wallet.currency
      const balanceBigInt = toBigIntBalance(wallet.totalBalance || '0', RESULT_DECIMALS)

      if (!aggregatedBalances[curr]) {
        aggregatedBalances[curr] = { value: 0n, decimals: 18 }
      }

      aggregatedBalances[curr].value += balanceBigInt
    }

    return aggregatedBalances
  }

  async getPriceData(
    context: EndpointContext<BaseEndpointTypes>,
    param: RequestParams,
    requestContext: RequestContext,
  ): Promise<Record<string, OraclePriceType>> {
    const results: Record<string, OraclePriceType> = {}

    for (const oracle of param.priceOracles) {
      const { token, contractAddress, chainId } = oracle
      const groupedProvider = this.getGroupedProvider(context, chainId, requestContext)
      const priceOracleContract = groupedProvider.createPriceOracleContract(contractAddress)
      const oraclePriceUSD: OraclePriceType = await priceOracleContract.getRateFromLatestRoundData()
      results[token] = oraclePriceUSD
    }

    return results
  }

  async computeUsdValue(
    balances: Record<string, { value: bigint; decimals: number }>,
    prices: Record<string, OraclePriceType>,
  ): Promise<Record<string, { value: bigint; decimals: number }>> {
    const usdValues: Record<string, { value: bigint; decimals: number }> = {}

    for (const [currency, { value }] of Object.entries(balances)) {
      const price = prices[currency]?.value
      if (!price) continue

      // normalize price to bigint(18)
      const priceBigInt = BigInt(price.toString())
      const priceDecimals = prices[currency]?.decimal ?? 18

      const normalizedPrice =
        priceDecimals < 18
          ? priceBigInt * 10n ** BigInt(18 - priceDecimals)
          : priceBigInt / 10n ** BigInt(priceDecimals - 18)

      usdValues[currency] = {
        value: (value * normalizedPrice) / 10n ** 18n,
        decimals: RESULT_DECIMALS,
      }
    }

    return usdValues
  }

  getSubscriptionTtlFromConfig(adapterSettings: BaseEndpointTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }
}

export const walletsTransport = new WalletsTransport()
