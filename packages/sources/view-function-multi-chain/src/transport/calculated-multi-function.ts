import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { calculateHttpRequestKey } from '@chainlink/external-adapter-framework/cache'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { GroupRunner } from '@chainlink/external-adapter-framework/util/group-runner'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import {
  AdapterError,
  AdapterInputError,
} from '@chainlink/external-adapter-framework/validation/error'
import { ethers } from 'ethers'
import {
  AptosCall,
  BaseEndpointTypes,
  ConstantParam,
  RequestParams,
  inputParameters,
} from '../endpoint/calculated-multi-function'
import { buildAptosViewRequest, validateAptosViewResponse } from '../utils/aptos-common'
import { evaluateOperation } from '../utils/operations'

const logger = makeLogger('CalculatedMultiFunctionTransport')

export type RawOnchainResponse = {
  iface: ethers.Interface
  fnName: string
  encodedResult: string
}

export class CalculatedMultiFunctionTransport extends SubscriptionTransport<BaseEndpointTypes> {
  config!: BaseEndpointTypes['Settings']
  providers: Record<string, ethers.JsonRpcProvider> = {}
  requester!: Requester
  endpointName!: string

  async initialize(
    dependencies: TransportDependencies<BaseEndpointTypes>,
    adapterSettings: BaseEndpointTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this.config = adapterSettings
    this.requester = dependencies.requester
    this.endpointName = endpointName
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
    const providerDataRequestedUnixMs = Date.now()

    const [evmResults, aptosResults] = await Promise.all([
      this._processCalls(param.functionCalls, this._executeEvmFunction),
      this._processCalls(param.aptosCalls, this._executeAptosFunction),
    ])
    const nestedResultOutcome = { ...evmResults, ...aptosResults }

    const timestamps = {
      providerDataRequestedUnixMs,
      providerDataReceivedUnixMs: Date.now(),
      providerIndicatedTimeUnixMs: undefined,
    }

    this.addConstantResults(param.constants, nestedResultOutcome)
    this.addOperationResults(param, nestedResultOutcome)

    const result = nestedResultOutcome['result'] ?? null

    return {
      data: nestedResultOutcome,
      statusCode: 200,
      result,
      timestamps,
    }
  }

  private async _executeEvmFunction(params: {
    address: string
    signature: string
    inputParams?: Array<string>
    network: string
    resultField?: string
  }) {
    const { address, signature, inputParams, network } = params

    const networkName = network.toUpperCase()
    const networkEnvName = `${networkName}_RPC_URL`
    const chainIdEnvName = `${networkName}_CHAIN_ID`

    const rpcUrl = process.env[networkEnvName]
    const chainId = Number(process.env[chainIdEnvName])

    if (!this.providers[networkName]) {
      this.providers[networkName] = new ethers.JsonRpcProvider(rpcUrl, chainId)
    }

    const iface = new ethers.Interface([signature])
    const fnName = iface.getFunctionName(signature)
    const encoded = iface.encodeFunctionData(fnName, inputParams || [])

    try {
      return await this.providers[networkName].call({ to: address, data: encoded })
    } catch (err) {
      throw new AdapterError({
        statusCode: 500,
        message: `RPC call failed for ${fnName} on ${networkName}: ${err}`,
      })
    }
  }

  private async _executeAptosFunction(call: AptosCall): Promise<string> {
    const requestConfig = buildAptosViewRequest(
      call.networkType,
      call.signature,
      call.type,
      call.arguments,
    )

    const cacheKey = calculateHttpRequestKey<BaseEndpointTypes>({
      context: {
        adapterSettings: this.config,
        inputParameters,
        endpointName: this.endpointName,
      },
      data: requestConfig.data,
      transportName: this.name,
    })
    const result = await this.requester.request<string[]>(cacheKey, requestConfig)
    validateAptosViewResponse(result.response.data, call.index)
    return String(result.response.data[call.index])
  }

  private async _processCalls<T extends { name: string }>(
    functionCalls: T[],
    execute: (call: T) => Promise<string>,
  ): Promise<Record<string, string>> {
    if (!Array.isArray(functionCalls) || functionCalls.length === 0) {
      return {}
    }

    const runner = new GroupRunner(this.config.GROUP_SIZE)

    const processNested = runner.wrapFunction(async (req: T): Promise<[string, string]> => {
      const key = req.name
      try {
        const result = await execute.bind(this)(req)
        return [key, result]
      } catch (err) {
        const statusCode = err instanceof AdapterError ? err.statusCode : 502
        throw new AdapterError({
          statusCode,
          message: `Function call "${key}" failed: ${err}`,
        })
      }
    })

    const settled: [string, string][] = await Promise.all(functionCalls.map(processNested))
    return Object.fromEntries(settled)
  }

  addConstantResults(constants: ConstantParam[], data: Record<string, string>) {
    for (const constant of constants) {
      data[constant.name] = constant.value
    }
  }

  private addOperationResults(params: RequestParams, data: Record<string, string>) {
    for (const { name, type, args } of params.operations) {
      data[name] = evaluateOperation(type, args, data, params)
    }
  }

  getSubscriptionTtlFromConfig(adapterSettings: BaseEndpointTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }
}

export const calculatedMultiFunctionTransport = new CalculatedMultiFunctionTransport()
