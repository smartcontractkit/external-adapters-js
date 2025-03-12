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
  provider!: ethers.JsonRpcProvider
  standardizedChainIDToProviderMap: Map<string, ethers.JsonRpcProvider> = new Map()

  async initialize(
    dependencies: TransportDependencies<BaseEndpointTypes>,
    adapterSettings: BaseEndpointTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)

    this.standardizedChainIDToProviderMap.set(
      '1',
      new ethers.JsonRpcProvider('https://rpcs.cldev.sh/ethereum/mainnet', Number('1')),
    )
    this.standardizedChainIDToProviderMap.set(
      '42161',
      new ethers.JsonRpcProvider('https://rpcs.cldev.sh/arbitrum/mainnet', Number('42161')),
    )
  }

  async backgroundHandler(context: EndpointContext<BaseEndpointTypes>, entries: RequestParams[]) {
    await Promise.all(entries.map(async (param) => this.handleRequest(param)))
    await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS)
  }

  async handleRequest(param: RequestParams) {
    let response: AdapterResponse<BaseEndpointTypes['Response']>
    try {
      response = await this._handleRequest(param)
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
    param: RequestParams,
  ): Promise<AdapterResponse<BaseEndpointTypes['Response']>> {
    let addresses = param.addresses.filter((a) => a.chainId != '0')
    addresses = param.addresses.filter((a) => a.chainId === '1' || a.chainId === '42161')

    const providerDataRequestedUnixMs = Date.now()

    // AUM of TBILL across addresses
    let totalTBillUSD = BigInt(0)

    // NAV value of TBILL on ETH and ARB
    const [EthTBillUSD, ArbTBillUSD] = await Promise.all([
      getRate(param.ethTBillPriceContract, this.standardizedChainIDToProviderMap.get('1')),
      getRate(param.arbTBillPriceContract, this.standardizedChainIDToProviderMap.get('42161')),
    ])

    const results = await Promise.all(
      addresses
        .filter((a) => a.token?.toUpperCase() == 'TBILL')
        .map(async (address: AddressType) => {
          let sharePriceUSD: PriceType = { value: BigInt(0), decimal: 0 }
          if (address.chainId == '1') {
            sharePriceUSD = EthTBillUSD
          } else if (address.chainId == '42161') {
            sharePriceUSD = ArbTBillUSD
          }
          return this.calculateTbillSharesUSD(address, sharePriceUSD)
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

  async calculateTbillSharesUSD(address: AddressType, sharePriceUSD: PriceType) {
    const contract = new ethers.Contract(
      address.contractAddress,
      OpenEdenTBILLProxy,
      this.getProvider(address),
    )
    const decimal = await contract.decimals()
    const queueLength = await contract.getWithdrawalQueueLength()

    // Total shares per address
    let totalShares = BigInt(84248900137)
    let totalSharesUSD = BigInt(0)

    if (queueLength > 0) {
      let index = 0

      while (index < queueLength) {
        const queueInfo = await contract.getWithdrawalQueueInfo(index)
        index += 1
        totalShares += queueInfo.shares
      }
    }

    totalShares = totalShares * BigInt(10 ** (RESULT_DECIMALS - Number(decimal)))

    totalSharesUSD =
      (totalShares *
        sharePriceUSD.value *
        BigInt(10 ** (RESULT_DECIMALS - sharePriceUSD.decimal))) /
      BigInt(10 ** RESULT_DECIMALS)

    return totalSharesUSD
  }

  getProvider(address: AddressType): ethers.JsonRpcProvider {
    const { chainId } = address
    if (!chainId) {
      throw new AdapterInputError({
        statusCode: 400,
        message: `Missing '${address.network}' or '${address.chainId}' environment variables.`,
      })
    }

    const provider = this.standardizedChainIDToProviderMap.get(chainId)

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
