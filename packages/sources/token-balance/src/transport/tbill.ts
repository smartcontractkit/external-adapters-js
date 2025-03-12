import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { BaseEndpointTypes, inputParameters } from '../endpoint/tbill'
import OpenEdenTBILLProxy from '../config/OpenEdenTBILLProxy.json'
import { ethers } from 'ethers'
import { getRate } from './priceFeed'

const logger = makeLogger('Token Balnce - Tbill')

type RequestParams = typeof inputParameters.validated

type AddressType = {
  network?: string
  chainId?: string
  contractAddress: string
}

type PriceType = {
  value: bigint
  decimal: number
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
    try {
      response = await this._handleRequest(context, param)
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
  ): Promise<AdapterResponse<BaseEndpointTypes['Response']>> {
    const addresses = param.addresses.filter(
      (a) =>
        a.chainId != '0' &&
        (a.chainId === String(context.adapterSettings.ETHEREUM_RPC_CHAIN_ID) ||
          a.chainId === String(context.adapterSettings.ARBITRUM_RPC_CHAIN_ID)),
    )

    const providerDataRequestedUnixMs = Date.now()

    // AUM of TBILL across addresses
    let totalTBillUSD = BigInt(0)

    // NAV value of TBILL on ETH and ARB
    const [ethTbillUSD, arbTbillUSD] = await Promise.all([
      getRate(param.ethTBillPriceContract, this.ethProvider),
      getRate(param.arbTBillPriceContract, this.arbProvider),
    ])

    const results = await Promise.all(
      addresses
        .filter((a) => a.token?.toUpperCase() == 'TBILL')
        .map(async (address: AddressType) => {
          let sharePriceUSD: PriceType = { value: BigInt(0), decimal: 0 }
          if (address.chainId === String(context.adapterSettings.ETHEREUM_RPC_CHAIN_ID)) {
            sharePriceUSD = ethTbillUSD
          } else if (address.chainId === String(context.adapterSettings.ARBITRUM_RPC_CHAIN_ID)) {
            sharePriceUSD = arbTbillUSD
          }
          return this.calculateTbillSharesUSD(context, address, sharePriceUSD)
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

  async calculateTbillSharesUSD(
    context: EndpointContext<BaseEndpointTypes>,
    address: AddressType,
    sharePriceUSD: PriceType,
  ) {
    const contract = new ethers.Contract(
      address.contractAddress,
      OpenEdenTBILLProxy,
      this.getProvider(context, address),
    )
    const decimal = await contract.decimals()
    const queueLength = await contract.getWithdrawalQueueLength()

    // Total shares per address
    let totalShares = BigInt(0)
    let totalSharesUSD = BigInt(0)

    if (queueLength > 0) {
      const indices = [...Array(queueLength).keys()]

      const results = await Promise.all(
        indices.map(async (index) => {
          const queueInfo = await contract.getWithdrawalQueueInfo(index)
          return queueInfo.shares
        }),
      )

      totalShares = results.reduce((sum: bigint, shares: bigint) => sum + shares, BigInt(0))
    }

    totalShares = totalShares * BigInt(10 ** (RESULT_DECIMALS - Number(decimal)))

    totalSharesUSD =
      (totalShares *
        sharePriceUSD.value *
        BigInt(10 ** (RESULT_DECIMALS - sharePriceUSD.decimal))) /
      BigInt(10 ** RESULT_DECIMALS)

    return totalSharesUSD
  }

  getProvider(
    context: EndpointContext<BaseEndpointTypes>,
    address: AddressType,
  ): ethers.JsonRpcProvider {
    const { chainId } = address
    if (!chainId) {
      throw new AdapterInputError({
        statusCode: 400,
        message: `Missing '${address.network}' or '${address.chainId}' environment variables.`,
      })
    }

    let provider!: ethers.JsonRpcProvider

    if (chainId === String(context.adapterSettings.ETHEREUM_RPC_CHAIN_ID)) {
      provider = this.ethProvider
    } else if (chainId === String(context.adapterSettings.ARBITRUM_RPC_CHAIN_ID)) {
      provider = this.arbProvider
    }

    if (!provider) {
      throw new AdapterInputError({
        statusCode: 400,
        message: `Missing network environment variables for ${address.network}.`,
      })
    }

    return provider
  }

  getSubscriptionTtlFromConfig(adapterSettings: BaseEndpointTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }
}

export const tbillTransport = new TbillTransport()
