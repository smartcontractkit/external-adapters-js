import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { ethers } from 'ethers'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { BaseEndpointTypes, inputParameters } from '../endpoint/evm'

const logger = makeLogger('Token Balances')

type RequestParams = typeof inputParameters.validated

export class ERC20TokenBalanceTransport extends SubscriptionTransport<BaseEndpointTypes> {
  // providers: Record<string, ethers.JsonRpcProvider> = {}
  chainIdToStandardizedNetworkMap: Map<string, string> = new Map()
  // TODO remove one of these
  chainIdRpcMap: Map<string, ethers.JsonRpcProvider> = new Map()
  standardizedNetworkToRpcMap: Map<string, ethers.JsonRpcProvider> = new Map()

  // reverse mapping from chain ID to RPC url
  constructChainIdRpcMap(): void {
    const _CHAIN_ID = '_CHAIN_ID'
    for (const [key, value] of Object.entries(process.env)) {
      if (!key.endsWith(_CHAIN_ID)) continue

      const chainId = value

      if (!chainId) {
        logger.warn(`env var ${key} is incorrect`)
        continue
      }
      if (this.chainIdRpcMap.has(chainId)) {
        logger.warn(`chain ID ${chainId} present multiple times`)
        continue
      }

      // extract network name from XXX_CHAIN_ID & get RPC URL
      const networkName = key.split(_CHAIN_ID)[0]
      this.chainIdToStandardizedNetworkMap.set(chainId, networkName)

      const rpcEnvVar = `${networkName}_RPC_URL`
      const rpcUrl = process.env[rpcEnvVar]

      if (!rpcUrl) {
        logger.warn(`Missing RPC_URL for ${networkName}`)
        continue
      }

      const provider = new ethers.JsonRpcProvider(rpcUrl, Number(chainId))
      this.chainIdRpcMap.set(chainId, provider)
      this.standardizedNetworkToRpcMap.set(networkName, provider)
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

    // // TODO handle network || chainId
    // for (const address of addresses) {
    //   if (!address.network || !address.chainId) {
    //     throw new AdapterInputError({
    //       statusCode: 400,
    //       message: "network or chainId missing"
    //     })
    //   }
    // }

    // verify & prep providers for this request
    addresses.forEach((address) => this.verifyProviders(address.network))

    // construct list of decimals RPC requests
    const constructDecimalsKey = (network: string, contractAddress: string): string =>
      `${network}_${contractAddress}`
    const decimalsMap = new Map<string, number | null>()
    const decimalsRequests = []
    for (const address of addresses) {
      const { network, contractAddress, decimalsSignature } = address
      const networkUpper = network.toUpperCase()
      const provider = this.standardizedNetworkToRpcMap.get(networkUpper)
      if (!provider) {
        throw new AdapterInputError({
          statusCode: 400,
          message: `provider not found for ${network}`,
        })
      }

      // since we can have multiple addresses with balances of the same token,
      // skip if we've encountered this chain_token pair already
      const decimalsKey = constructDecimalsKey(network, contractAddress)
      if (decimalsMap.has(decimalsKey)) {
        logger.debug(`skipping decimals fetch for contract address ${address}`)
        continue
      }
      decimalsMap.set(decimalsKey, null)

      // get decimals
      const iface = new ethers.Interface([decimalsSignature])
      const decimalsFunctionName = iface.getFunctionName(decimalsSignature)
      const decimalsEncoded = iface.encodeFunctionData(decimalsFunctionName)
      // console.log(decimalsEncoded)

      // push with callback including network and contract address
      decimalsRequests.push(
        provider
          .call({
            to: contractAddress,
            data: decimalsEncoded,
          })
          .then((result) => {
            // console.log(result)
            return {
              network,
              contractAddress,
              decimals: Number(iface.decodeFunctionResult(decimalsSignature, result)[0]),
            }
          }),
      )
    }

    const decimalsResponses = await Promise.all(decimalsRequests)

    decimalsResponses.forEach((response) => {
      const decimalsKey = constructDecimalsKey(response.network, response.contractAddress)
      decimalsMap.set(decimalsKey, response.decimals)
      // console.log(response)
    })

    // construct list of RPC balance requests
    const balanceRequests = []
    for (const address of addresses) {
      const { network, contractAddress, wallets, balanceOfSignature } = address
      const networkUpper = network.toUpperCase()
      const provider = this.standardizedNetworkToRpcMap.get(networkUpper)
      if (!provider) {
        throw new AdapterInputError({
          statusCode: 400,
          message: `provider not found for ${network}`,
        })
      }

      const iface = new ethers.Interface([balanceOfSignature])
      const balanceOfFunctionName = iface.getFunctionName(balanceOfSignature)

      for (const wallet of wallets) {
        const balanceOfEncoded = iface.encodeFunctionData(balanceOfFunctionName, [wallet])
        // console.log(balanceOfEncoded)

        balanceRequests.push(
          provider
            .call({
              to: contractAddress,
              data: balanceOfEncoded,
            })
            .then((result) => {
              // console.log(`result ${result}, result decoded: ${iface.decodeFunctionResult(balanceOfSignature, result)}`)

              return {
                network,
                contractAddress,
                walletAddress: wallet,
                balance: String(iface.decodeFunctionResult(balanceOfSignature, result)[0]),
                decimals: decimalsMap.get(constructDecimalsKey(network, contractAddress)) || 0,
              }
            }),
        )
      }
    }

    const balanceResponses = await Promise.all(balanceRequests)

    // compute result by scaling all to 18 decimals
    // TODO: handle decimals > 18
    const result = balanceResponses.reduce(
      (accumulator, current) =>
        current.decimals === 18
          ? accumulator + ethers.toBigInt(current.balance)
          : accumulator +
            ethers.toBigInt(current.balance) * ethers.toBigInt(Math.pow(10, 18 - current.decimals)),
      ethers.toBigInt(0),
    )
    // console.log(balanceResponses)

    const providerDataRequestedUnixMs = Date.now()
    return {
      data: {
        result: String(result),
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

  verifyProviders(network: string): void {
    const networkName = network.toUpperCase()
    const networkEnvName = `${networkName}_RPC_URL`
    const chainIdEnvName = `${networkName}_CHAIN_ID`

    const rpcUrl = process.env[networkEnvName]
    const chainId = Number(process.env[chainIdEnvName])

    if (
      !rpcUrl ||
      isNaN(chainId) ||
      (!this.chainIdRpcMap.has(String(chainId)) &&
        !this.standardizedNetworkToRpcMap.has(networkName))
    ) {
      throw new AdapterInputError({
        statusCode: 400,
        message: `Missing '${networkEnvName}' or '${chainIdEnvName}' environment variables.`,
      })
    }

    // if (!this.providers[networkName]) {
    //   this.providers[networkName] = new ethers.JsonRpcProvider(rpcUrl, chainId)
    // }
  }

  getSubscriptionTtlFromConfig(adapterSettings: BaseEndpointTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }
}

export const erc20TokenBalanceTransport = new ERC20TokenBalanceTransport()
