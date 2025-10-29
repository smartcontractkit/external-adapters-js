import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import {
  TransportDependencies,
  TransportGenerics,
} from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import {
  AdapterError,
  AdapterInputError,
} from '@chainlink/external-adapter-framework/validation/error'
import { ethers } from 'ethers'

const logger = makeLogger('View Function Multi Chain')

interface RequestParams {
  signature: string
  address: string
  inputParams?: Array<string>
  network: string
  resultField?: string
  data?: Record<string, RequestParams>
}

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
  T extends TransportGenerics,
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

  async backgroundHandler(context: EndpointContext<T>, entries: Array<T['Parameters']>) {
    await Promise.all(
      entries.map(async (param) => this.handleRequest(param as unknown as RequestParams)),
    )
    await sleep(
      (context.adapterSettings as unknown as { BACKGROUND_EXECUTE_MS: number })
        .BACKGROUND_EXECUTE_MS,
    )
  }

  async handleRequest(param: RequestParams) {
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
    await this.responseCache.write(this.name, [{ params: param as any, response }])
  }

  async _handleRequest(param: RequestParams): Promise<AdapterResponse<T['Response']>> {
    const { address, signature, inputParams, network, data } = param

    const mainResult = await this._executeFunction({
      address,
      signature,
      inputParams,
      network,
      resultField: param.resultField,
    })

    const nestedResults = await this._processNestedDataRequest(data, address, network)

    const combinedData = { result: mainResult.result, ...nestedResults }

    return {
      data: combinedData,
      statusCode: 200,
      result: mainResult.result,
      timestamps: mainResult.timestamps,
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

    const providerDataRequestedUnixMs = Date.now()

    let encodedResult
    try {
      encodedResult = await this.providers[networkName].call({ to: address, data: encoded })
    } catch (err) {
      throw new AdapterError({
        statusCode: 500,
        message: `RPC call failed for ${fnName} on ${networkName}: ${err}`,
      })
    }

    const timestamps = {
      providerDataRequestedUnixMs,
      providerDataReceivedUnixMs: Date.now(),
      providerIndicatedTimeUnixMs: undefined,
    }

    const result = this.hexResultPostProcessor({ iface, fnName, encodedResult }, resultField)

    return { result, timestamps }
  }

  private async _processNestedDataRequest(
    data: Record<string, unknown> | undefined,
    parentAddress: string,
    parentNetwork: string,
  ): Promise<Record<string, any>> {
    if (!data || typeof data !== 'object') return {}

    const results: Record<string, any> = {}

    for (const [key, subReq] of Object.entries(data)) {
      try {
        const req = subReq as RequestParams

        if (!req.signature) {
          logger.warn(`Skipping nested key "${key}" — no signature provided.`)
          continue
        }

        const nestedParam = {
          address: req.address || parentAddress,
          network: req.network || parentNetwork,
          signature: req.signature,
          inputParams: req.inputParams,
          resultField: req.resultField,
        }

        const subRes = await this._executeFunction(nestedParam)
        results[key] = subRes.result
      } catch (err) {
        logger.warn(`Nested function "${key}" failed: ${err}`)
        results[key] = null
      }
    }

    return results
  }

  getSubscriptionTtlFromConfig(adapterSettings: T['Settings']): number {
    return (adapterSettings as { WARMUP_SUBSCRIPTION_TTL: number }).WARMUP_SUBSCRIPTION_TTL
  }
}

// Export a factory function to create transport instances
export function createMultiChainFunctionTransport<T extends TransportGenerics>(
  postProcessor: HexResultPostProcessor,
): MultiChainFunctionTransport<T> {
  return new MultiChainFunctionTransport<T>(postProcessor)
}
