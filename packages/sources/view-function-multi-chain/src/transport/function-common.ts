import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import {
  AdapterError,
  AdapterInputError,
} from '@chainlink/external-adapter-framework/validation/error'
import { TypeFromDefinition } from '@chainlink/external-adapter-framework/validation/input-params'
import { ethers } from 'ethers'
import { BaseEndpointTypes as FunctionEndpointTypes } from '../endpoint/function'
import { BaseEndpointTypes as FunctionResponseSelectorEndpointTypes } from '../endpoint/function-response-selector'

const logger = makeLogger('View Function Multi Chain')

type GenericFunctionEndpointTypes = FunctionEndpointTypes | FunctionResponseSelectorEndpointTypes

// The `extends any ? ... : never` construct forces the compiler to distribute
// over unions. Without it, the compiler doesn't know that T is either
// FunctionEndpointTypes or FunctionResponseSelectorEndpointTypes.
type RequestParams<T extends GenericFunctionEndpointTypes> = T extends any
  ? TypeFromDefinition<T['Parameters']>
  : never

export type RawOnchainResponse = {
  iface: ethers.Interface
  fnName: string
  encodedResult: string
}

export type HexResultPostProcessor = (
  onchainResponse: RawOnchainResponse,
  resultField?: string | undefined,
) => string

export class MultiChainFunctionTransport<
  T extends GenericFunctionEndpointTypes,
> extends SubscriptionTransport<T> {
  providers: Record<string, ethers.JsonRpcProvider> = {}
  hexResultPostProcessor: HexResultPostProcessor

  constructor(hexResultPostProcessor: HexResultPostProcessor) {
    super()
    this.hexResultPostProcessor = hexResultPostProcessor
  }

  async initialize(
    dependencies: TransportDependencies<T>,
    adapterSettings: T['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
  }

  async backgroundHandler(context: EndpointContext<T>, entries: RequestParams<T>[]) {
    await Promise.all(entries.map(async (param) => this.handleRequest(param)))
    await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS)
  }

  async handleRequest(param: RequestParams<T>) {
    let response: AdapterResponse<T['Response']>
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

  async _handleRequest(param: RequestParams<T>): Promise<AdapterResponse<T['Response']>> {
    const providerDataRequestedUnixMs = Date.now()

    const result = await this._executeFunction(param)

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

  private async _executeFunction(params: {
    address: string
    signature: string
    inputParams?: Array<string>
    network: string
    resultField?: string
  }) {
    const { address, signature, inputParams, network, resultField } = params

    const networkName = network.toUpperCase()
    const networkEnvName = `${networkName}_RPC_URL`
    const chainIdEnvName = `${networkName}_CHAIN_ID`

    const rpcUrl = process.env[networkEnvName]
    const chainId = Number(process.env[chainIdEnvName])

    if (!rpcUrl || isNaN(chainId)) {
      throw new AdapterInputError({
        statusCode: 400,
        message: `Missing '${networkEnvName}' or '${chainIdEnvName}' environment variables.`,
      })
    }

    if (!this.providers[networkName]) {
      this.providers[networkName] = new ethers.JsonRpcProvider(rpcUrl, chainId)
    }

    const iface = new ethers.Interface([signature])
    const fnName = iface.getFunctionName(signature)
    const encoded = iface.encodeFunctionData(fnName, inputParams || [])

    let encodedResult
    try {
      encodedResult = await this.providers[networkName].call({ to: address, data: encoded })
    } catch (err) {
      throw new AdapterError({
        statusCode: 500,
        message: `RPC call failed for ${fnName} on ${networkName}: ${err}`,
      })
    }

    const result = this.hexResultPostProcessor({ iface, fnName, encodedResult }, resultField)

    return result
  }

  getSubscriptionTtlFromConfig(adapterSettings: T['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }
}

// Export a factory function to create transport instances
export function createMultiChainFunctionTransport<T extends GenericFunctionEndpointTypes>(
  postProcessor: HexResultPostProcessor,
): MultiChainFunctionTransport<T> {
  return new MultiChainFunctionTransport<T>(postProcessor)
}
