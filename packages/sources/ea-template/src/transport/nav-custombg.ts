import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { ResponseCache } from '@chainlink/external-adapter-framework/cache/response'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import {
  AdapterResponse, sleep, makeLogger
} from '@chainlink/external-adapter-framework/util'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { BaseEndpointTypes, inputParameters } from '../endpoint/nav'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'

const logger = makeLogger('CustomTransport')

type RequestParams = typeof inputParameters.validated

// CustomTransport extends base types from endpoint and adds additional, Provider-specific types (if needed).
export type CustomTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: any
  }
}
// CustomTransport is used to perform custom data fetching and processing from a Provider. The framework provides built-in transports to
// fetch data from a Provider using several protocols, including `http`, `websocket`, and `sse`. Use CustomTransport when the Provider uses
// different protocol, or you need custom functionality that built-in transports don't support. For example, custom, multistep authentication
// for requests, paginated requests, on-chain data retrieval using third party libraries, and so on.
export class CustomTransport extends SubscriptionTransport<CustomTransportTypes> {
  // name of the transport, used for logging
  name!: string
  // cache instance for caching responses from provider
  responseCache!: ResponseCache<CustomTransportTypes>
  // instance of Requester to be used for data fetching. Use this instance to perform http calls
  requester!: Requester

  // REQUIRED. Transport will be automatically initialized by the framework using this method. It will be called with transport
  // dependencies, adapter settings, endpoint name, and transport name as arguments. Use this method to initialize transport state
  async initialize(dependencies: TransportDependencies<CustomTransportTypes>, adapterSettings: CustomTransportTypes['Settings'], endpointName: string, transportName: string): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this.requester = dependencies.requester
  }
  // 'backgroundHandler' is called on each background execution iteration. It receives endpoint context as first argument
  // and an array of all the entries in the subscription set as second argument. Use this method to handle the incoming
  // request, process it and save it in the cache.
  async backgroundHandler(context: EndpointContext<CustomTransportTypes>, entries: RequestParams[]) {
    await Promise.all(entries.map(async (param) => this.handleRequest(param)))
    await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS)
  }

  async handleRequest(param: RequestParams) {
    let response: AdapterResponse<CustomTransportTypes['Response']>
    try {
      response = await this._handleRequest(param)
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred'
      logger.error(e, errorMessage)
      response = {
        statusCode: (e as AdapterError)?.statusCode || 502,
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
    _: RequestParams,
  ): Promise<AdapterResponse<CustomTransportTypes['Response']>> {

     const providerDataRequestedUnixMs = Date.now()

     // custom transport logic

    return {
      data: {
        result: 2000,
      },
      statusCode: 200,
      result: 2000,
      timestamps: {
        providerDataRequestedUnixMs,
        providerDataReceivedUnixMs: Date.now(),
        providerIndicatedTimeUnixMs: undefined,
      },
    }
  }

  getSubscriptionTtlFromConfig(adapterSettings: CustomTransportTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }
}

export const customSubscriptionTransport = new CustomTransport()