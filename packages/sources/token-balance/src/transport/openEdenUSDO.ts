import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { BaseEndpointTypes, inputParameters } from '../endpoint/openEdenUSDO'
import OpenEdenTBILLProxy from '../config/OpenEdenTBILLProxy.json'
import { ethers } from 'ethers'
import { getRate } from './priceFeed'

const logger = makeLogger('OpenEdenUSDO')

type RequestParams = typeof inputParameters.validated

type AddressType = {
  network?: string
  chainId?: string
  contractAddress: string
}

const RESULT_DECIMALS = 18

export class OpenEdenUSDOTransport extends SubscriptionTransport<BaseEndpointTypes> {
  provider!: ethers.JsonRpcProvider

  // eg: '1': 'ETHEREUM" and "ETHEREUM": provider
  chainIdToStandardizedNetworkMap: Map<string, string> = new Map()
  standardizedNetworkToProviderMap: Map<string, ethers.JsonRpcProvider> = new Map()

  // reverse mapping from chain ID to network to RPC url
  constructChainIdRpcMap(): void {
    const _RPC_CHAIN_ID = '_RPC_CHAIN_ID'
    for (const [key, value] of Object.entries(process.env)) {
      if (!key.endsWith(_RPC_CHAIN_ID)) continue

      const chainId = value

      if (!chainId) {
        logger.warn(`env var ${key} is incorrect`)
        continue
      }
      if (this.chainIdToStandardizedNetworkMap.has(chainId)) {
        logger.warn(`chain ID ${chainId} present multiple times`)
        continue
      }

      // extract network name from XXX_RPC_CHAIN_ID & get RPC_URL
      const networkName = key.split(_RPC_CHAIN_ID)[0]
      this.chainIdToStandardizedNetworkMap.set(chainId, networkName)

      const rpcEnvVar = `${networkName}_RPC_URL`
      const rpcUrl = process.env[rpcEnvVar]

      if (!rpcUrl) {
        logger.warn(`Missing RPC_URL for ${networkName}`)
        continue
      }

      const provider = new ethers.JsonRpcProvider(rpcUrl, Number(chainId))
      this.standardizedNetworkToProviderMap.set(networkName, provider)
      logger.info(`created provider for network: ${networkName}, chain ID: ${chainId}`)
    }
  }

  async initialize(
    dependencies: TransportDependencies<BaseEndpointTypes>,
    adapterSettings: BaseEndpointTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this.constructChainIdRpcMap()
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
    const addresses = param.addresses.filter((a) => a.chainId != '0')
    const providerDataRequestedUnixMs = Date.now()

    // AUM of TBILL across addresses
    let totalTBillUSD = BigInt(0)

    if (!param.arbTBillPriceContract || !param.ethTBillPriceContract) {
      throw new Error('Missing [eth/arb] TBillPriceContract')
    }

    // NAV value of TBILL on ETH and ARB
    const [EthTBillUSD, ArbTBillUSD] = await Promise.all([
      getRate(
        param.ethTBillPriceContract.contractAddress,
        this.getProvider(param.ethTBillPriceContract),
      ),
      getRate(
        param.arbTBillPriceContract.contractAddress,
        this.getProvider(param.arbTBillPriceContract),
      ),
    ])

    for (const address of addresses) {
      const contract = new ethers.Contract(
        address.contractAddress,
        OpenEdenTBILLProxy,
        this.getProvider(address),
      )
      let queueLength = await contract.getWithdrawalQueueLength()

      // Total shares per address
      let totalShares = BigInt(0)

      if (queueLength > 0) {
        let index = 0

        while (queueLength >= 0) {
          const queueInfo = await contract.getWithdrawalQueueInfo(index)
          index += 1
          queueLength--
          totalShares += queueInfo.shares
        }
      }

      totalShares = totalShares * BigInt(10 ** (RESULT_DECIMALS - 6))

      if (address.chainId == '1') {
        totalTBillUSD +=
          (totalShares *
            EthTBillUSD.value *
            BigInt(10 ** (RESULT_DECIMALS - EthTBillUSD.decimal))) /
          BigInt(10 ** RESULT_DECIMALS)
      } else if (address.chainId == '42161') {
        totalTBillUSD +=
          (totalShares *
            ArbTBillUSD.value *
            BigInt(10 ** (RESULT_DECIMALS - ArbTBillUSD.decimal))) /
          BigInt(10 ** RESULT_DECIMALS)
      }
    }

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

  getProvider(address: AddressType): ethers.JsonRpcProvider {
    const { chainId } = address
    const network =
      chainId && this.chainIdToStandardizedNetworkMap.has(chainId)
        ? this.chainIdToStandardizedNetworkMap.get(chainId)
        : address.network?.toUpperCase()

    if (!network) {
      throw new AdapterInputError({
        statusCode: 400,
        message: `Missing '${address.network}' or '${address.chainId}' environment variables.`,
      })
    }

    const provider = this.standardizedNetworkToProviderMap.get(network)
    if (!provider) {
      throw new AdapterInputError({
        statusCode: 400,
        message: `Missing network environment variables for ${network}.`,
      })
    }

    return provider
  }

  getSubscriptionTtlFromConfig(adapterSettings: BaseEndpointTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }
}

export const openEdenUSDOTransport = new OpenEdenUSDOTransport()
