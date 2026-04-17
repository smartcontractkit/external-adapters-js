import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { calculateHttpRequestKey } from '@chainlink/external-adapter-framework/cache'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { BaseEndpointTypes, inputParameters } from '../endpoint/http'
import { createResponses, prepareRequests } from './utils'

const logger = makeLogger('Single HTTP Transport')

type RequestParams = typeof inputParameters.validated

// This was originally an HTTP transport and we wanted to keep the same
// endpoint.
export class GenericApiHttpTransport extends SubscriptionTransport<BaseEndpointTypes> {
  requester!: Requester

  async initialize(
    dependencies: TransportDependencies<BaseEndpointTypes>,
    adapterSettings: BaseEndpointTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this.requester = dependencies.requester
  }

  async backgroundHandler(context: EndpointContext<BaseEndpointTypes>, entries: RequestParams[]) {
    await Promise.all(entries.map(async (param) => this.handleRequest(context, param)))
    await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS)
  }

  async handleRequest(context: EndpointContext<BaseEndpointTypes>, param: RequestParams) {
    let response: AdapterResponse<BaseEndpointTypes['Response']>
    try {
      response = await this._handleRequest(context, param)
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
    context: EndpointContext<BaseEndpointTypes>,
    param: RequestParams,
  ): Promise<AdapterResponse<BaseEndpointTypes['Response']>> {
    const providerDataRequestedUnixMs = Date.now()
    const requestConfig = prepareRequests([param])[0]
    const result = await this.requester.request<object>(
      calculateHttpRequestKey<BaseEndpointTypes>({
        context,
        data: requestConfig.params,
        transportName: this.name,
      }),
      requestConfig.request,
    )
    const response = createResponses<BaseEndpointTypes>({
      params: [param],
      apiResponse: result.response,
      mapParam: (param) => ({
        apiName: param.apiName,
        dataPaths: [{ name: 'result', path: param.dataPath }],
        ripcordPath: param.ripcordPath,
        ripcordDisabledValue: param.ripcordDisabledValue,
        providerIndicatedTimePath: param.providerIndicatedTimePath,
      }),
      mapResponse: (multiHttpResponse) => ({
        result: String(multiHttpResponse.result),
        data: {
          ...multiHttpResponse.data,
          result: String(multiHttpResponse.data.result),
        },
        statusCode: multiHttpResponse.statusCode,
        timestamps: multiHttpResponse.timestamps,
      }),
    })[0].response
    return {
      ...response,
      timestamps: {
        ...response.timestamps,
        providerDataRequestedUnixMs,
        providerDataReceivedUnixMs: Date.now(),
      },
    }
  }

  getSubscriptionTtlFromConfig(adapterSettings: BaseEndpointTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }
}

export const httpTransport = new GenericApiHttpTransport()
