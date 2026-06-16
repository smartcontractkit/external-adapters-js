import { ResponseCache } from '@chainlink/external-adapter-framework/cache/response'
import { Transport, TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import {
  AdapterRequest,
  AdapterResponse,
  makeLogger,
} from '@chainlink/external-adapter-framework/util'
import { EmptyInputParameters } from '@chainlink/external-adapter-framework/validation/input-params'
import { BaseEndpointTypes } from '../endpoint/mco2'

const logger = makeLogger('MCO2Transport')

const ENDPOINT_NO_LONGER_SUPPORTED_MESSAGE = 'The mco2 endpoint is no longer supported.'

const getClientIp = (req: AdapterRequest<EmptyInputParameters>): string =>
  req.ip ? req.ip : req.ips?.length ? req.ips[req.ips.length - 1] : 'unknown'

export type CustomTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: never
  }
}

export class CustomTransport implements Transport<CustomTransportTypes> {
  name!: string
  responseCache!: ResponseCache<CustomTransportTypes>

  async initialize(
    dependencies: TransportDependencies<CustomTransportTypes>,
    _adapterSettings: CustomTransportTypes['Settings'],
    _endpointName: string,
    transportName: string,
  ): Promise<void> {
    this.responseCache = dependencies.responseCache
    this.name = transportName
  }

  async foregroundExecute(
    req: AdapterRequest<EmptyInputParameters>,
  ): Promise<AdapterResponse<BaseEndpointTypes['Response']>> {
    const clientIp = getClientIp(req)
    logger.warn(`Received request to deprecated mco2 endpoint from IP: ${clientIp}`)

    const now = Date.now()
    return {
      statusCode: 410,
      errorMessage: ENDPOINT_NO_LONGER_SUPPORTED_MESSAGE,
      timestamps: {
        providerDataRequestedUnixMs: now,
        providerDataReceivedUnixMs: now,
        providerIndicatedTimeUnixMs: undefined,
      },
    }
  }
}

export const customTransport = new CustomTransport()
