import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { ResponseCache } from '@chainlink/external-adapter-framework/cache/response'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { BaseEndpointTypes } from '../endpoint/address'
import { AddressListTransportTypes, BaseAddressListTransport, RequestParams } from './common'

const logger = makeLogger('BaseAddressListTransport')

export class AddressAdhocTransport extends BaseAddressListTransport {
  name!: string
  responseCache!: ResponseCache<AddressListTransportTypes>
  requester!: Requester
  settings!: AddressListTransportTypes['Settings']
  activeParams: RequestParams[] = []

  async initialize(
    dependencies: TransportDependencies<AddressListTransportTypes>,
    adapterSettings: AddressListTransportTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this.requester = dependencies.requester
    this.settings = adapterSettings
  }

  async backgroundHandler(
    context: EndpointContext<AddressListTransportTypes>,
    entries: RequestParams[],
  ) {
    await Promise.all(entries.map(async (param) => this.handleRequest(param)))
    await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS)
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
    await this.responseCache.write(this.name, [{ params: param, response }])
  }

  async _handleRequest(
    param: RequestParams,
  ): Promise<AdapterResponse<BaseEndpointTypes['Response']>> {
    return this.getAggregatedAddressList(param)
  }
}

export const addressAdhocTransport = new AddressAdhocTransport()
