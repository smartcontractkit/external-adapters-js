import { ResponseCache } from '@chainlink/external-adapter-framework/cache/response'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { BaseEndpointTypes, inputParameters } from '../endpoint/address'

const logger = makeLogger('BaseAddressListTransport')

export type AddressListTransportTypes = BaseEndpointTypes
export type RequestParams = typeof inputParameters.validated

interface PoRAdapterResponse {
  data: {
    result: {
      network: string
      chainId: string
      address: string
    }[]
  }
  statusCode: number
  result: null
  timestamps: {
    providerDataRequestedUnixMs: number
    providerDataReceivedUnixMs: number
  }
}

export abstract class BaseAddressListTransport extends SubscriptionTransport<AddressListTransportTypes> {
  name!: string
  responseCache!: ResponseCache<AddressListTransportTypes>
  requester!: Requester
  settings!: AddressListTransportTypes['Settings']
  activeParams: RequestParams[] = []

  async getAggregatedAddressList(params: RequestParams) {
    const providerDataRequestedUnixMs = Date.now()

    const addresses = await this.fetchSourceAddresses(params)
    logger.info(`Fetched ${addresses.length} addresses`)

    const response = {
      data: {
        result: addresses,
      },
      statusCode: 200,
      result: null,
      timestamps: {
        providerDataRequestedUnixMs,
        providerDataReceivedUnixMs: Date.now(),
        providerIndicatedTimeUnixMs: undefined,
      },
    }
    return response
  }

  async fetchSourceAddresses(params: RequestParams) {
    const { chainId, network, ...sources } = params

    const promises = Object.entries(sources)
      .filter(([_, sourceParams]) => sourceParams)
      .map(async ([sourceName, sourceParams]) => {
        // customInputValidation ensures that if the source EA is present in the input params, the corresponding env variable is also present
        const adapterUrl = `${sourceName.toUpperCase()}_ADAPTER_URL` as keyof typeof this.settings
        const requestConfig = {
          url: this.settings[adapterUrl] as string,
          method: 'POST',
          data: {
            data: {
              ...sourceParams,
              chainId,
              network,
            },
          },
        }

        const sourceResponse = await this.requester.request<PoRAdapterResponse>(
          JSON.stringify(requestConfig),
          requestConfig,
        )
        return sourceResponse.response.data.data.result
      })

    const addresses = await Promise.all(promises)
    return addresses.flat()
  }

  getSubscriptionTtlFromConfig(adapterSettings: AddressListTransportTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }
}
