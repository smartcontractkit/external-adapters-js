import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import {
  TransportDependencies,
  TransportGenerics,
} from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { GroupRunner } from '@chainlink/external-adapter-framework/util/group-runner'
import {
  AdapterError,
  AdapterInputError,
} from '@chainlink/external-adapter-framework/validation/error'
import { TypeFromDefinition } from '@chainlink/external-adapter-framework/validation/input-params'
import { ethers } from 'ethers'
import { BaseEndpointTypes, inputParameters } from '../endpoint/function'

const logger = makeLogger('View Function Multi Chain')

type RequestParams = typeof inputParameters.validated & {
  resultField?: string
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

function toBytes32Hex(value: number | bigint): string {
  const hex = BigInt(value).toString(16)
  return '0x' + hex.padStart(64, '0')
}

export class MultiChainFunctionTransport<
  T extends TransportGenerics,
> extends SubscriptionTransport<T> {
  config!: BaseEndpointTypes['Settings']
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
    this.config = adapterSettings as BaseEndpointTypes['Settings']
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

    await this.responseCache.write(this.name, [
      { params: param as TypeFromDefinition<T['Parameters']>, response },
    ])
  }

  async _handleRequest(param: RequestParams): Promise<AdapterResponse<T['Response']>> {
    const { address, signature, inputParams, network, additionalRequests } = param

    const [mainResult, nestedResultOutcome] = await Promise.all([
      this._executeFunction({
        address,
        signature,
        inputParams,
        network,
        resultField: param.resultField,
      }),
      this._processNestedDataRequest(additionalRequests, address, network),
    ])

    const combinedData = { result: mainResult.result, ...nestedResultOutcome }

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
    additionalRequests:
      | Array<{
          name: string
          signature: string
        }>
      | undefined,
    parentAddress: string,
    parentNetwork: string,
  ): Promise<Record<string, string>> {
    const results: Record<string, string> = {}

    if (!Array.isArray(additionalRequests) || additionalRequests.length === 0) {
      return results
    }

    const HARDCODED_VALUES: Record<string, Record<string, number>> = {
      '0xcCcc62962d17b8914c62D74FfB843d73B2a3cccC': {
        decimals: 6,
      },
    }

    const runner = new GroupRunner(this.config.GROUP_SIZE)

    const processNested = runner.wrapFunction(
      async (req: { name: string; signature: string }): Promise<[string, string | null]> => {
        const key = req.name
        try {
          if (!req.signature) {
            throw new Error(`Missing signature for nested key "${key}"`)
          }

          const hardcoded = HARDCODED_VALUES[parentAddress]?.[key]
          if (hardcoded !== undefined) {
            return [key, toBytes32Hex(hardcoded)]
          }

          const nestedParam = {
            address: parentAddress,
            network: parentNetwork,
            signature: req.signature,
          }

          const subRes = await this._executeFunction(nestedParam)
          return [key, subRes.result]
        } catch (err) {
          throw new Error(`Nested function "${key}" failed: ${err}`)
        }
      },
    )

    const settled: [string, string | null][] = await Promise.all(
      additionalRequests.map(processNested),
    )

    for (const [key, value] of settled) {
      if (value !== null) {
        results[key] = value
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
