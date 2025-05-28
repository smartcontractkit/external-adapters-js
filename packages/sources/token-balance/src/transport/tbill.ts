import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { ethers } from 'ethers'
import { BaseEndpointTypes, inputParameters } from '../endpoint/tbill'
import { GroupedProvider, GroupedTokenContract, SharePriceType } from './utils'

const logger = makeLogger('Token Balance - Tbill')

type RequestParams = typeof inputParameters.validated

type AddressType = {
  network?: string
  chainId?: string
  contractAddress: string
  token: string
  wallets: Array<string>
  priceOracleAddress: string
}

type RequestContext = {
  groupedProviders: {
    [chainId: string]: GroupedProvider
  }
}

const RESULT_DECIMALS = 18

export class TbillTransport extends SubscriptionTransport<BaseEndpointTypes> {
  ethProvider!: ethers.JsonRpcProvider
  arbProvider!: ethers.JsonRpcProvider

  async initialize(
    dependencies: TransportDependencies<BaseEndpointTypes>,
    adapterSettings: BaseEndpointTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)

    if (!adapterSettings.ETHEREUM_RPC_URL) {
      logger.error('ETHEREUM_RPC_URL is missing')
    } else {
      this.ethProvider = new ethers.JsonRpcProvider(
        adapterSettings.ETHEREUM_RPC_URL,
        Number(adapterSettings.ETHEREUM_RPC_CHAIN_ID),
      )
    }

    if (!adapterSettings.ARBITRUM_RPC_URL) {
      logger.error('ARBITRUM_RPC_URL is missing')
    } else {
      this.arbProvider = new ethers.JsonRpcProvider(
        adapterSettings.ARBITRUM_RPC_URL,
        Number(adapterSettings.ARBITRUM_RPC_CHAIN_ID),
      )
    }
  }

  async backgroundHandler(context: EndpointContext<BaseEndpointTypes>, entries: RequestParams[]) {
    await Promise.all(entries.map(async (param) => this.handleRequest(context, param)))
    await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS)
  }

  async handleRequest(context: EndpointContext<BaseEndpointTypes>, param: RequestParams) {
    let response: AdapterResponse<BaseEndpointTypes['Response']>
    const requestContext: RequestContext = {
      groupedProviders: {},
    }
    try {
      response = await this._handleRequest(context, param, requestContext)
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
    context: EndpointContext<BaseEndpointTypes>,
    param: RequestParams,
    requestContext: RequestContext,
  ): Promise<AdapterResponse<BaseEndpointTypes['Response']>> {
    const addresses = param.addresses.filter(
      (a) =>
        a.chainId === String(context.adapterSettings.ETHEREUM_RPC_CHAIN_ID) ||
        a.chainId === String(context.adapterSettings.ARBITRUM_RPC_CHAIN_ID),
    )

    const providerDataRequestedUnixMs = Date.now()

    // AUM of TBILL across addresses
    let totalTBillUSD = BigInt(0)

    const results = await Promise.all(
      addresses.map(async (address: AddressType) => {
        return this.calculateTbillSharesUSD(context, address, requestContext)
      }),
    )

    totalTBillUSD = results.reduce((sum: bigint, value: bigint) => sum + value, BigInt(0))

    return {
      data: {
        result: String(totalTBillUSD),
        decimals: RESULT_DECIMALS,
      },
      statusCode: 200,
      result: String(totalTBillUSD),
      timestamps: {
        providerDataRequestedUnixMs,
        providerDataReceivedUnixMs: Date.now(),
        providerIndicatedTimeUnixMs: undefined,
      },
    }
  }

  getGroupedProvider(
    context: EndpointContext<BaseEndpointTypes>,
    address: AddressType,
    requestContext: RequestContext,
  ): GroupedProvider {
    let provider!: ethers.JsonRpcProvider
    if (address.chainId === String(context.adapterSettings.ETHEREUM_RPC_CHAIN_ID)) {
      provider = this.ethProvider
    } else if (address.chainId === String(context.adapterSettings.ARBITRUM_RPC_CHAIN_ID)) {
      provider = this.arbProvider
    } else {
      throw new AdapterInputError({
        statusCode: 400,
        message: `ChainId ${address.chainId} not supported for Tbill.`,
      })
    }

    if (!requestContext.groupedProviders[address.chainId]) {
      requestContext.groupedProviders[address.chainId] = new GroupedProvider(
        provider,
        context.adapterSettings.GROUP_SIZE,
      )
    }
    return requestContext.groupedProviders[address.chainId]
  }

  async calculateTbillSharesUSD(
    context: EndpointContext<BaseEndpointTypes>,
    address: AddressType,
    requestContext: RequestContext,
  ) {
    const groupedProvider = this.getGroupedProvider(context, address, requestContext)

    const contract = groupedProvider.createTokenContract(address.contractAddress)
    const priceOracleContract = groupedProvider.createPriceOracleContract(
      address.priceOracleAddress,
    )

    const [sharePriceUSD, sharesDecimals, queueLength, balanceResponse] = await Promise.all([
      priceOracleContract.getRate(),
      contract.decimals(),
      contract.getWithdrawalQueueLength(address.token),
      Promise.all(address.wallets.map((wallet) => contract.balanceOf(wallet))),
    ])

    if (sharePriceUSD === undefined) {
      throw new Error('sharePriceUSD is undefined')
    }

    let totalSharesUSD = BigInt(0)
    // TBILL x NAV Per Share Feed to Derive Total Value in $ USD.
    totalSharesUSD += await this.getShareAum(balanceResponse, sharePriceUSD, sharesDecimals)

    // TBILL Withdrawal Queue Balance
    totalSharesUSD += await this.getWithdrawalQueueAum(
      queueLength,
      contract,
      address.wallets,
      sharePriceUSD,
      sharesDecimals,
    )

    return totalSharesUSD
  }

  async getShareAum(
    balanceResponse: bigint[],
    sharePriceUSD: SharePriceType,
    sharesDecimals: bigint,
  ) {
    let totalShares = BigInt(0)
    totalShares = balanceResponse.reduce((accumulator, value) => {
      return (
        accumulator + BigInt(value) * BigInt(Math.pow(10, RESULT_DECIMALS - Number(sharesDecimals)))
      )
    }, BigInt(0))

    return (
      (totalShares *
        sharePriceUSD.value *
        BigInt(10 ** (RESULT_DECIMALS - sharePriceUSD.decimal))) /
      BigInt(10 ** RESULT_DECIMALS)
    )
  }

  async getWithdrawalQueueAum(
    queueLength: bigint,
    tbillWithrawalQueueContract: GroupedTokenContract,
    wallets: string[],
    sharePriceUSD: SharePriceType,
    sharesDecimals: bigint,
  ) {
    let totalShares = BigInt(0)

    if (queueLength > 0) {
      const indices = [...Array(queueLength).keys()]

      const results = await Promise.all(
        indices.map(async (index) => {
          const queueInfo = await tbillWithrawalQueueContract.getWithdrawalQueueInfo(index)
          if (queueInfo.sender === queueInfo.receiver && wallets.includes(queueInfo.sender)) {
            return queueInfo.shares
          } else {
            return 0n
          }
        }),
      )

      totalShares = results.reduce((sum: bigint, shares: bigint) => sum + shares, BigInt(0))
      totalShares = totalShares * BigInt(10 ** (RESULT_DECIMALS - Number(sharesDecimals)))

      return (
        (totalShares *
          sharePriceUSD.value *
          BigInt(10 ** (RESULT_DECIMALS - sharePriceUSD.decimal))) /
        BigInt(10 ** RESULT_DECIMALS)
      )
    }

    return totalShares
  }

  getSubscriptionTtlFromConfig(adapterSettings: BaseEndpointTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }
}

export const tbillTransport = new TbillTransport()
