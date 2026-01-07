import { ResponseCache } from '@chainlink/external-adapter-framework/cache/response'
import { Transport, TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import {
  AdapterRequest,
  AdapterResponse,
  makeLogger,
} from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { BaseEndpointTypes, inputParameters } from '../endpoint/address'
import { AddressListTransportTypes, getAggregatedAddressList, RequestParams } from './common'

const logger = makeLogger('BaseAddressListTransport')

export class AddressDebugTransport implements Transport<AddressListTransportTypes> {
  name!: string
  responseCache!: ResponseCache<AddressListTransportTypes>
  requester!: Requester
  settings!: AddressListTransportTypes['Settings']
  activeParams: RequestParams[] = []

  async initialize(
    dependencies: TransportDependencies<AddressListTransportTypes>,
    adapterSettings: AddressListTransportTypes['Settings'],
    _endpointName: string,
    transportName: string,
  ): Promise<void> {
    this.requester = dependencies.requester
    this.responseCache = dependencies.responseCache
    this.settings = adapterSettings
    this.name = transportName
  }

  async foregroundExecute(
    req: AdapterRequest<typeof inputParameters.validated>,
  ): Promise<AdapterResponse<BaseEndpointTypes['Response']>> {
    const entries = req.requestContext.data
    return await this.handleRequest(entries)
  }

  async handleRequest(param: RequestParams) {
    let response: AdapterResponse<BaseEndpointTypes['Response']>
    try {
      response = await this._handleRequest(param)
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred'
      logger.error(e, errorMessage)
      response = {
        statusCode: 502,
        errorMessage,
        timestamps: {
          providerDataRequestedUnixMs: 0,
          providerDataReceivedUnixMs: 0,
          providerIndicatedTimeUnixMs: undefined,
        },
      }
    }
    return response
  }

  async _handleRequest(
    param: RequestParams,
  ): Promise<AdapterResponse<BaseEndpointTypes['Response']>> {
    return getAggregatedAddressList(param, this.requester, this.settings)
  }
}

export const addressDebugTransport = new AddressDebugTransport()
