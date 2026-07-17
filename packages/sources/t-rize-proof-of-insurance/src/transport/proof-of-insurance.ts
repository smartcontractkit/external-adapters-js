import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/proof-of-insurance'
import {
  decodeRootToDecimal,
  getTrizeApiEndpoint,
  normalizeContractIdToDecimal,
} from '../utils/t-rize-common'

export interface ResponseSchema {
  root: string
  contractId: string
  computedAt: string
  error?: string
}

export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: ResponseSchema
  }
}

export const httpTransport = new HttpTransport<HttpTransportTypes>({
  prepareRequests: (params, config) => {
    return params.map((param) => {
      return {
        params: [param],
        request: {
          url: getTrizeApiEndpoint(param.network),
          params: {
            owner_party_id: param.ownerPartyId,
            tree_id: param.treeId,
          },
          headers: {
            Accept: 'application/json',
            'x-api-key': config.TRIZE_API_KEY,
          },
        },
      }
    })
  },
  parseResponse: (params, response) => {
    if (!response.data) {
      return params.map((param) => {
        return {
          params: param,
          response: {
            errorMessage: `The data provider didn't return any value for ownerPartyId=${param.ownerPartyId}, treeId=${param.treeId}`,
            statusCode: 502,
          },
        }
      })
    }

    const providerError = response.data.error

    if (providerError) {
      return params.map((param) => {
        return {
          params: param,
          response: {
            errorMessage: providerError,
            statusCode: 502,
          },
        }
      })
    }

    try {
      // Note: Both root and contractId are opaque hashes. We want to make these
      // hashes available via Streams. Since there is no appropriate schema for this,
      // we decided to encode these hashes as int192 numbers so they can be made
      // available in the v9 schema. To fit the hashes into these numbers, we need to
      // truncate them. This assumes that 23 bytes of each hash is enough to be able
      // to reliably compare the hash to the original hash.
      const rootDecimal = decodeRootToDecimal(response.data.root)
      const contractIdDecimal = normalizeContractIdToDecimal(response.data.contractId)
      const providerIndicatedTimeUnixMs = Date.parse(response.data.computedAt)

      if (Number.isNaN(providerIndicatedTimeUnixMs)) {
        throw new Error(
          `Unable to parse computedAt: invalid timestamp value ${JSON.stringify(
            response.data.computedAt,
          )}.`,
        )
      }

      return params.map((param) => {
        return {
          params: param,
          response: {
            result: rootDecimal,
            data: {
              root: rootDecimal,
              contractId: contractIdDecimal,
            },
            timestamps: {
              providerIndicatedTimeUnixMs,
            },
          },
        }
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'

      return params.map((param) => {
        return {
          params: param,
          response: {
            errorMessage,
            statusCode: 502,
          },
        }
      })
    }
  },
})
