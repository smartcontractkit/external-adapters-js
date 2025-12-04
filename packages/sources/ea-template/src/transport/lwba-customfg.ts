import { Transport, TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { ResponseCache } from '@chainlink/external-adapter-framework/cache/response'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import {
  AdapterRequest,
  AdapterResponse,
} from '@chainlink/external-adapter-framework/util'
import { BaseEndpointTypes, inputParameters } from '../endpoint/lwba'

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
export class CustomTransport implements Transport<CustomTransportTypes> {
  // name of the transport, used for logging
  name!: string
  // cache instance for caching responses from provider
  responseCache!: ResponseCache<CustomTransportTypes>
  // instance of Requester to be used for data fetching. Use this instance to perform http calls
  requester!: Requester

  // REQUIRED. Transport will be automatically initialized by the framework using this method. It will be called with transport
  // dependencies, adapter settings, endpoint name, and transport name as arguments. Use this method to initialize transport state
  async initialize(dependencies: TransportDependencies<CustomTransportTypes>, _adapterSettings: CustomTransportTypes['Settings'], _endpointName: string, transportName: string): Promise<void> {
    this.responseCache = dependencies.responseCache
    this.requester = dependencies.requester
    this.name = transportName
  }
  // 'foregroundExecute' performs synchronous fetch/processing of information within the lifecycle of an incoming request. It takes
  // request object (adapter request, which is wrapper around fastify request) and adapter settings. Use this method to handle the incoming
  // request, process it,save it in the cache and return to user.
  async foregroundExecute(
    _: AdapterRequest<typeof inputParameters.validated>
  ): Promise<AdapterResponse<CustomTransportTypes['Response']>> {

    // Custom transport logic

    const response = {
      data: {
        result: 100,
      },
      statusCode: 200,
      result: 100,
      timestamps: {
        providerDataRequestedUnixMs: Date.now(),
        providerDataReceivedUnixMs: Date.now(),
        providerIndicatedTimeUnixMs: undefined,
      },
    }

    return response
  }
}

export const customTransport = new CustomTransport()