import { ResponseCache } from '@chainlink/external-adapter-framework/cache/response'
import { Transport, TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { AdapterRequest, AdapterResponse } from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import v8 from 'v8'
import { BaseEndpointTypes, inputParameters } from '../endpoint/heapdump'

export type CustomTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: any
  }
}
export class CustomTransport implements Transport<CustomTransportTypes> {
  name!: string
  responseCache!: ResponseCache<CustomTransportTypes>
  requester!: Requester

  async initialize(
    dependencies: TransportDependencies<CustomTransportTypes>,
    _adapterSettings: CustomTransportTypes['Settings'],
    _endpointName: string,
    transportName: string,
  ): Promise<void> {
    this.responseCache = dependencies.responseCache
    this.requester = dependencies.requester
    this.name = transportName
  }
  async foregroundExecute(
    _: AdapterRequest<typeof inputParameters.validated>,
  ): Promise<AdapterResponse<CustomTransportTypes['Response']>> {
    const chunks: Buffer[] = []
    const stream = v8.getHeapSnapshot()
    for await (const chunk of stream) {
      chunks.push(chunk instanceof Buffer ? chunk : Buffer.from(chunk))
    }

    const response = {
      data: {
        snapshot: Buffer.concat(chunks).toString('base64'),
      },
      statusCode: 200,
      result: null,
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
