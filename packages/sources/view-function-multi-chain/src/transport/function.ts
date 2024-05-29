import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { ethers, utils } from 'ethers'
import { RpcProvider, constants } from 'starknet'
import { BigNumber } from 'bignumber.js'
import { BaseEndpointTypes, inputParameters } from '../endpoint/function'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'

const logger = makeLogger('View Function Multi Chain')

export type MultiChainFunctionTransportTypes = BaseEndpointTypes

type RequestParams = typeof inputParameters.validated

export class MultiChainFunctionTransport extends SubscriptionTransport<MultiChainFunctionTransportTypes> {
  providers: Record<string, ethers.providers.JsonRpcProvider> = {}

  async initialize(
    dependencies: TransportDependencies<MultiChainFunctionTransportTypes>,
    adapterSettings: MultiChainFunctionTransportTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
  }

  async backgroundHandler(
    context: EndpointContext<MultiChainFunctionTransportTypes>,
    entries: RequestParams[],
  ) {
    await Promise.all(entries.map(async (param) => this.handleRequest(param)))
    await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS)
  }

  async handleRequest(param: RequestParams) {
    let response: AdapterResponse<MultiChainFunctionTransportTypes['Response']>
    try {
      response = await this._handleRequestMultiChain(param)
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

  async _handleRequestMultiChain(
    param: RequestParams,
  ): Promise<AdapterResponse<MultiChainFunctionTransportTypes['Response']>> {
    const { network } = param

    const networkName = network.toUpperCase()
    const networkEnvName = `${networkName}_RPC_URL`
    const chainIdEnvName = `${networkName}_CHAIN_ID`

    const rpcUrl = process.env[networkEnvName]

    // The Starknet ChainIds are too large to fit into the JS Number type
    const chainId = new BigNumber(process.env[chainIdEnvName] ?? NaN)

    if (!rpcUrl || chainId.isNaN()) {
      throw new AdapterInputError({
        statusCode: 400,
        message: `Missing '${networkEnvName}': '${rpcUrl}' or '${chainIdEnvName}': '${chainId.toString()}' environment variables.`,
      })
    }

    if (
      !chainId.equals(constants.StarknetChainId.SN_SEPOLIA) &&
      !chainId.equals(constants.StarknetChainId.SN_MAIN)
    ) {
      return this._handleRequestEVM(param, rpcUrl, chainId.toNumber())
    } else {
      return this._handleRequestStarknet(param, rpcUrl)
    }
  }

  async _handleRequestStarknet(
    param: RequestParams,
    rpcUrl: string,
  ): Promise<AdapterResponse<MultiChainFunctionTransportTypes['Response']>> {
    const { address, signature, inputParams } = param

    const starknetProvider = new RpcProvider({ nodeUrl: rpcUrl })

    const callData = {
      contractAddress: address,
      entrypoint: signature,
      calldata: inputParams,
    }

    const providerDataRequestedUnixMs = Date.now()
    const res = await starknetProvider.callContract(callData)
    const result = res[0]

    return {
      data: {
        result,
      },
      statusCode: 200,
      result,
      timestamps: {
        providerDataRequestedUnixMs,
        providerDataReceivedUnixMs: Date.now(),
        providerIndicatedTimeUnixMs: undefined,
      },
    }
  }

  async _handleRequestEVM(
    param: RequestParams,
    rpcUrl: string,
    chainId: number,
  ): Promise<AdapterResponse<MultiChainFunctionTransportTypes['Response']>> {
    const { address, signature, inputParams, network } = param

    const networkName = network.toUpperCase()

    if (!this.providers[networkName]) {
      this.providers[networkName] = new ethers.providers.JsonRpcProvider(rpcUrl, chainId)
    }

    const iface = new utils.Interface([signature])
    const fnName = iface.functions[Object.keys(iface.functions)[0]].name

    const encoded = iface.encodeFunctionData(fnName, [...(inputParams || [])])

    const providerDataRequestedUnixMs = Date.now()
    const result = await this.providers[networkName].call({
      to: address,
      data: encoded,
    })

    return {
      data: {
        result,
      },
      statusCode: 200,
      result,
      timestamps: {
        providerDataRequestedUnixMs,
        providerDataReceivedUnixMs: Date.now(),
        providerIndicatedTimeUnixMs: undefined,
      },
    }
  }

  getSubscriptionTtlFromConfig(
    adapterSettings: MultiChainFunctionTransportTypes['Settings'],
  ): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }
}

export const multiChainFunctionTransport = new MultiChainFunctionTransport()
