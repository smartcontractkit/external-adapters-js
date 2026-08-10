import { HttpTransport } from '@chainlink/external-adapter-framework/transports/http'
import { BaseEndpointTypes, inputParameters } from '../endpoint/types'
import { extractSignedPayload, isFresh, isSaneSignature, parsePublicKeys, rescale } from './utils'

type RequestParams = typeof inputParameters.validated

interface InfralabsResponse {
  data: {
    index_name: string
    value: string
    scale: string
    timestamp: string
    schema_version: string
  }
  signature: string
}

export function createInfralabsTransport(
  apiEndpointFn: (s: BaseEndpointTypes['Settings']) => string,
  maxStalenessFn: (s: BaseEndpointTypes['Settings']) => number,
): HttpTransport<BaseEndpointTypes> {
  return new HttpTransport<BaseEndpointTypes>({
    prepareRequests: (params, adapterSettings) => ({
      params,
      request: {
        url: apiEndpointFn(adapterSettings),
        method: 'GET',
        headers: { Authorization: `ApiKey ${adapterSettings.API_KEY}` },
        responseType: 'text',
      },
    }),
    parseResponse: (params: RequestParams[], response, adapterSettings) => {
      try {
        const rawResponseBody = response.data as unknown as string
        const responseBody = JSON.parse(rawResponseBody) as InfralabsResponse

        const publicKeys = parsePublicKeys(adapterSettings.INFRALABS_PUBLIC_KEYS)
        const signedPayload = extractSignedPayload(rawResponseBody)
        if (!isSaneSignature(signedPayload, publicKeys, responseBody.signature)) {
          throw new Error('Signature verification failed')
        }

        const maxStaleness = maxStalenessFn(adapterSettings)
        if (!isFresh(responseBody.data.timestamp, maxStaleness, Date.now())) {
          throw new Error('Price is stale')
        }

        const scale = parseInt(responseBody.data.scale, 10)
        const result = rescale(responseBody.data.value, scale)

        return params.map((param) => ({
          params: param,
          response: {
            result: result.toString(),
            data: {
              price: Number(result) / 10 ** 8,
              rawValue: responseBody.data.value,
              scale,
              lastUpdatedAt: parseInt(responseBody.data.timestamp, 10),
              signature: responseBody.signature,
            },
            statusCode: 200,
            timestamps: {
              providerDataRequestedUnixMs: 0, // overwritten by the framework with real request timing
              providerDataReceivedUnixMs: 0, // overwritten by the framework with real request timing
              providerIndicatedTimeUnixMs: parseInt(responseBody.data.timestamp, 10) * 1000,
            },
          },
        }))
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred'
        return params.map((param) => ({
          params: param,
          response: {
            statusCode: 502,
            errorMessage,
            timestamps: {
              providerDataRequestedUnixMs: 0,
              providerDataReceivedUnixMs: 0,
              providerIndicatedTimeUnixMs: undefined,
            },
          },
        }))
      }
    },
  })
}
