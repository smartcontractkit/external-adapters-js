import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { BaseEndpointTypes, inputParameters } from '../endpoint/function'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { RpcProvider, num } from 'starknet'
import { config } from '../config'

const logger = makeLogger('View Starknet Latest Answer')

export type StarknetLatestAnswerFunctionTransportTypes = BaseEndpointTypes

type RequestParams = typeof inputParameters.validated

export class StarknetLatestAnswerFunctionTransport extends SubscriptionTransport<StarknetLatestAnswerFunctionTransportTypes> {
  provider: RpcProvider | undefined

  async initialize(
    dependencies: TransportDependencies<StarknetLatestAnswerFunctionTransportTypes>,
    adapterSettings: StarknetLatestAnswerFunctionTransportTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
  }

  async backgroundHandler(
    context: EndpointContext<StarknetLatestAnswerFunctionTransportTypes>,
    entries: RequestParams[],
  ) {
    await Promise.all(entries.map(async (param) => this.handleRequest(param)))
    await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS)
  }

  async handleRequest(param: RequestParams) {
    let response: AdapterResponse<StarknetLatestAnswerFunctionTransportTypes['Response']>
    try {
      response = await this._handleRequestStarknet(param)
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

  async _handleRequestStarknet(
    param: RequestParams,
  ): Promise<AdapterResponse<StarknetLatestAnswerFunctionTransportTypes['Response']>> {
    const { address } = param
    const { STARKNET_RPC_URL } = config.settings

    const rpcUrl = STARKNET_RPC_URL

    if (!rpcUrl) {
      throw new AdapterInputError({
        statusCode: 400,
        message: `Missing RPC URL: '${rpcUrl}' environment variables.`,
      })
    }

    if (!this.provider) {
      this.provider = new RpcProvider({ nodeUrl: rpcUrl })
    }

    const callData = {
      contractAddress: address,
      entrypoint: 'latest_round_data',
      calldata: [],
    }

    const providerDataRequestedUnixMs = Date.now()

    let res
    try {
      // res: [round_id, answer, block_num, started_at, updated_at]
      res = await this.provider.callContract(callData)
    } catch (e) {
      throw new AdapterInputError({
        statusCode: 502,
        message: `RpcProvider.callContract Failed - ${e}`,
      })
    }

    if (res === undefined || res.length < 2) {
      throw new AdapterInputError({
        statusCode: 502,
        message: `RpcProvider.callContract returned bad result ${res}`,
      })
    }

    // extract field "answer"
    const answer = num.hexToDecimalString(res[1])

    return {
      data: {
        result: answer,
      },
      statusCode: 200,
      result: answer,
      timestamps: {
        providerDataRequestedUnixMs,
        providerDataReceivedUnixMs: Date.now(),
        providerIndicatedTimeUnixMs: undefined,
      },
    }
  }

  getSubscriptionTtlFromConfig(
    adapterSettings: StarknetLatestAnswerFunctionTransportTypes['Settings'],
  ): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }
}

export const starknetLatestAnswerFunctionTransport = new StarknetLatestAnswerFunctionTransport()
