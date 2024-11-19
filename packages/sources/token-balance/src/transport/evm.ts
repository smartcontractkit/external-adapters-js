import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { ethers } from 'ethers'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { BaseEndpointTypes, inputParameters } from '../endpoint/evm'

const logger = makeLogger('Token Balances')

type RequestParams = typeof inputParameters.validated

type NormalizedPoRTokenAddress = {
  network: string
  contractAddress: string
  wallets: string[]
  balanceOfSignature: string
  decimalsSignature: string
  provider: ethers.JsonRpcProvider
}

const RESULT_DECIMALS = 18

export class ERC20TokenBalanceTransport extends SubscriptionTransport<BaseEndpointTypes> {
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
    const { addresses } = param

    // verify providers exist for this request
    const normalizedAddresses = this.verifyProviders(addresses)

    // construct list of decimals RPC requests
    const constructDecimalsKey = (network: string, contractAddress: string): string =>
      `${network}_${contractAddress}`

    const providerDataRequestedUnixMs = Date.now()
    const decimalsMap = await this.constructDecimalsMap(normalizedAddresses, constructDecimalsKey)

    // construct list of RPC balance requests
    const balanceRequests = []
    for (const address of normalizedAddresses) {
      const { network, contractAddress, wallets, balanceOfSignature, provider } = address
      const iface = new ethers.Interface([balanceOfSignature])
      const balanceOfFunctionName = iface.getFunctionName(balanceOfSignature)

      const decimals = decimalsMap.get(constructDecimalsKey(network, contractAddress))
      if (!decimals) {
        throw new AdapterInputError({
          statusCode: 400,
          message: `Could not get decimals for contract ${contractAddress}.`,
        })
      }

      for (const wallet of wallets) {
        const balanceOfEncoded = iface.encodeFunctionData(balanceOfFunctionName, [wallet])
        balanceRequests.push(
          provider
            .call({
              to: contractAddress,
              data: balanceOfEncoded,
            })
            .then((result) => ({
              network: network.toLowerCase(), // return lowercase
              contractAddress,
              walletAddress: wallet,
              balance: String(iface.decodeFunctionResult(balanceOfSignature, result)[0]),
              decimals,
            })),
        )
      }
    }

    const balanceResponses = await Promise.all(balanceRequests)

    // compute result by scaling all to desired RESULT_DECIMALS decimals
    const result = balanceResponses.reduce((accumulator, current) => {
      if (current.decimals < RESULT_DECIMALS) {
        return (
          accumulator +
          BigInt(current.balance) * BigInt(Math.pow(10, RESULT_DECIMALS - current.decimals))
        )
      } else if (current.decimals > RESULT_DECIMALS) {
        return (
          accumulator +
          BigInt(current.balance) / BigInt(Math.pow(10, current.decimals - RESULT_DECIMALS))
        )
      }
      return accumulator + BigInt(current.balance) // RESULT_DECIMALS decimals
    }, BigInt(0))

    return {
      data: {
        result: String(result),
        decimals: RESULT_DECIMALS,
        wallets: balanceResponses,
      },
      statusCode: 200,
      result: String(result),
      timestamps: {
        providerDataRequestedUnixMs,
        providerDataReceivedUnixMs: Date.now(),
        providerIndicatedTimeUnixMs: undefined,
      },
    }
  }

  private async constructDecimalsMap(
    normalizedAddresses: NormalizedPoRTokenAddress[],
    constructDecimalsKey: (network: string, contractAddress: string) => string,
  ): Promise<Map<string, number>> {
    const decimalsRequests = []
    for (const address of normalizedAddresses) {
      const { network, contractAddress, decimalsSignature, provider } = address

      // get decimals
      const iface = new ethers.Interface([decimalsSignature])
      const decimalsFunctionName = iface.getFunctionName(decimalsSignature)
      const decimalsEncoded = iface.encodeFunctionData(decimalsFunctionName)

      // push with callback including network and contract address
      decimalsRequests.push(
        provider
          .call({
            to: contractAddress,
            data: decimalsEncoded,
          })
          .then((result) => ({
            network,
            contractAddress,
            decimals: Number(iface.decodeFunctionResult(decimalsSignature, result)[0]),
          })),
      )
    }

    const decimalsResponses = await Promise.all(decimalsRequests)

    const decimalsMap = new Map<string, number>()
    decimalsResponses.forEach((response) => {
      const decimalsKey = constructDecimalsKey(response.network, response.contractAddress)
      decimalsMap.set(decimalsKey, response.decimals)
    })
    return decimalsMap
  }

  // parsed in endpoint/evm, so guaranteed to have one of network, chainId per address
  // Verify provider/mappings exists for chainId or network, otherwise error
  verifyProviders(addresses: RequestParams['addresses']): NormalizedPoRTokenAddress[] {
    const normalizedAddresses: NormalizedPoRTokenAddress[] = []
    for (const address of addresses) {
      const { chainId, contractAddress, wallets, balanceOfSignature, decimalsSignature } = address
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

      normalizedAddresses.push({
        network,
        contractAddress,
        wallets,
        balanceOfSignature,
        decimalsSignature,
        provider,
      })
    }
    return normalizedAddresses
  }

  getSubscriptionTtlFromConfig(adapterSettings: BaseEndpointTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }
}

export const erc20TokenBalanceTransport = new ERC20TokenBalanceTransport()
