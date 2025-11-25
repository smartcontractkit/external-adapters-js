import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { GroupRunner } from '@chainlink/external-adapter-framework/util/group-runner'
import {
  AdapterError,
  AdapterInputError,
} from '@chainlink/external-adapter-framework/validation/error'
import { ethers } from 'ethers'
import {
  BaseEndpointTypes,
  ConstantParam,
  FunctionCall,
  RequestParams,
} from '../endpoint/calculated-multi-function'
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

  async initialize(
    dependencies: TransportDependencies<BaseEndpointTypes>,
    adapterSettings: BaseEndpointTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this.config = adapterSettings
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

    const nestedResultOutcome = await this._processNestedDataRequest(param.functionCalls)

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

  private async _executeFunction(params: {
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

    const providerDataRequestedUnixMs = Date.now()

    let result
    try {
      result = await this.providers[networkName].call({ to: address, data: encoded })
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

    return { result, timestamps }
  }

  private async _processNestedDataRequest(
    functionCalls: FunctionCall[],
  ): Promise<Record<string, string>> {
    if (!Array.isArray(functionCalls) || functionCalls.length === 0) {
      return {}
    }

    const runner = new GroupRunner(this.config.GROUP_SIZE)

    const processNested = runner.wrapFunction(
      async (req: FunctionCall): Promise<[string, string]> => {
        const key = req.name
        try {
          const nestedParam = {
            address: req.address,
            network: req.network,
            signature: req.signature,
            inputParams: req.inputParams,
          }

          const subRes = await this._executeFunction(nestedParam)
          return [key, subRes.result]
        } catch (err) {
          const statusCode = err instanceof AdapterError ? err.statusCode : 502
          throw new AdapterError({
            statusCode,
            message: `Function call "${key}" failed: ${err}`,
          })
        }
      },
    )

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
