import { AdapterSettings } from '@chainlink/external-adapter-framework/config'
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

export async function getAggregatedAddressList(
  params: RequestParams,
  requester: Requester,
  settings: AdapterSettings,
) {
  const providerDataRequestedUnixMs = Date.now()

  const addresses = await fetchSourceAddresses(params, requester, settings)
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

async function fetchSourceAddresses(
  params: RequestParams,
  requester: Requester,
  settings: AdapterSettings,
) {
  const { chainId, network, ...sources } = params

  const promises = Object.entries(sources)
    .filter(([_, sourceParams]) => sourceParams)
    .map(async ([sourceName, sourceParams]) => {
      // customInputValidation ensures that if the source EA is present in the input params, the corresponding env variable is also present
      const adapterUrl = `${sourceName.toUpperCase()}_ADAPTER_URL` as keyof typeof settings
      const requestConfig = {
        url: settings[adapterUrl] as string,
        // url: process.env(adapterUrl)
        method: 'POST',
        data: {
          data: {
            ...sourceParams,
            chainId,
            network,
          },
        },
      }

      const sourceResponse = await requester.request<PoRAdapterResponse>(
        JSON.stringify(requestConfig),
        requestConfig,
      )
      return sourceResponse.response.data.data.result
    })

  const addresses = await Promise.all(promises)
  return addresses.flat()
}
