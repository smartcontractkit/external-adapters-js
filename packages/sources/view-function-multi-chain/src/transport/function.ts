import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import {
  AdapterResponse,
  makeLogger,
  ResponseTimestamps,
  sleep,
} from '@chainlink/external-adapter-framework/util'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { ethers } from 'ethers'
import { BaseEndpointTypes, inputParameters } from '../endpoint/function'

const logger = makeLogger('View Function Multi Chain')

export type MultiChainFunctionTransportTypes = BaseEndpointTypes

type RequestParams = typeof inputParameters.validated

type RawOnchainResponse = {
  iface: ethers.Interface
  fnName: string
  encodedResult: string
  timestamps: ResponseTimestamps
}

export class MultiChainFunctionTransport extends SubscriptionTransport<MultiChainFunctionTransportTypes> {
  providers: Record<string, ethers.JsonRpcProvider> = {}
  hexResultPostProcessor: (
    onchainResponse: RawOnchainResponse,
    resultField?: string | undefined,
    resultIndex?: number | undefined,
  ) => AdapterResponse<MultiChainFunctionTransportTypes['Response']>

  constructor(
    hexResultPostProcessor: (
      onchainResponse: RawOnchainResponse,
      resultField?: string | undefined,
      resultIndex?: number | undefined,
    ) => AdapterResponse<MultiChainFunctionTransportTypes['Response']>,
  ) {
    super()
    this.hexResultPostProcessor = hexResultPostProcessor
  }

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
      const onchainResponse = await this.getContractResponseHex(param)
      response = this.hexResultPostProcessor(onchainResponse, param.resultField, param.resultIndex)
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

  async getContractResponseHex(param: RequestParams): Promise<RawOnchainResponse> {
    const { address, signature, inputParams, network } = param

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
    const encoded = iface.encodeFunctionData(fnName, [...(inputParams || [])])

    const providerDataRequestedUnixMs = Date.now()
    const encodedResult = await this.providers[networkName].call({
      to: address,
      data: encoded,
    })

    const timestamps = {
      providerDataRequestedUnixMs,
      providerDataReceivedUnixMs: Date.now(),
      providerIndicatedTimeUnixMs: undefined,
    }

    return { iface, fnName, encodedResult, timestamps }
  }

  getSubscriptionTtlFromConfig(
    adapterSettings: MultiChainFunctionTransportTypes['Settings'],
  ): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }
}

/* eslint-disable @typescript-eslint/no-unused-vars */
function createHexResultPostProcessor(
  onchainResponse: RawOnchainResponse,
  _resultField?: string | undefined,
  _resultIndex?: number | undefined,
): AdapterResponse<MultiChainFunctionTransportTypes['Response']> {
  const { encodedResult, timestamps } = onchainResponse

  return {
    data: {
      result: encodedResult,
    },
    statusCode: 200,
    result: encodedResult,
    timestamps,
  }
}
/* eslint-enable @typescript-eslint/no-unused-vars */

function createDecodedResultPostProcessor(
  onchainResponse: RawOnchainResponse,
  resultField?: string | undefined,
  resultIndex?: number | undefined,
): AdapterResponse<MultiChainFunctionTransportTypes['Response']> {
  const { iface, fnName, encodedResult, timestamps } = onchainResponse

  let result: string

  if (resultField) {
    const decodedResult = iface.decodeFunctionResult(fnName, encodedResult)
    result = BigInt(decodedResult[resultField]).toString()
  } else if (resultIndex != null) {
    const decodedResult = iface.decodeFunctionResult(fnName, encodedResult)
    result = BigInt(decodedResult[resultIndex]).toString()
  } else {
    throw new AdapterInputError({
      message: 'Missing one of resultField or resultIndex input variables',
      statusCode: 400,
    })
  }

  return {
    data: {
      result,
    },
    statusCode: 200,
    result,
    timestamps,
  }
}

export const multiChainFunctionTransport = new MultiChainFunctionTransport(
  createHexResultPostProcessor,
)
export const multiChainFunctionResponseSelectorTransport = new MultiChainFunctionTransport(
  createDecodedResultPostProcessor,
)
