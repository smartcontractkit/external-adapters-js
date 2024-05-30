import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { BaseEndpointTypes, inputParameters } from '../endpoint/function'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { RpcProvider } from 'starknet'

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

    const networkEnvName = 'STARKNET_RPC_URL'

    const rpcUrl = process.env[networkEnvName]

    if (!rpcUrl) {
      throw new AdapterInputError({
        statusCode: 400,
        message: `Missing '${networkEnvName}': '${rpcUrl}' environment variables.`,
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
    const res = await this.provider.callContract(callData)
    const result = res[1]

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
    adapterSettings: StarknetLatestAnswerFunctionTransportTypes['Settings'],
  ): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }
}

export const starknetLatestAnswerFunctionTransport = new StarknetLatestAnswerFunctionTransport()
