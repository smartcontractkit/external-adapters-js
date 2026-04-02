import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/proof-of-insurance'

// 23 bytes keeps the carrier value safely within positive int192 bounds.
const TRUNCATED_CARRIER_BYTES = 23

// Shared carrier rule for both fields: take the leftmost 23 bytes, interpret them
// as an unsigned big-endian integer, and return its decimal string representation.
const truncateBytesToDecimal = (byteValue: Buffer, sourceField: 'root' | 'contractId'): string => {
  const truncatedHex = byteValue.subarray(0, TRUNCATED_CARRIER_BYTES).toString('hex')

  if (!truncatedHex) {
    throw new Error(`Unable to map ${sourceField}: decoded value is empty.`)
  }

  return BigInt(`0x${truncatedHex}`).toString()
}

const decodeRootToDecimal = (base64Value: string): string => {
  let decodedBytes: Buffer

  try {
    decodedBytes = Buffer.from(atob(base64Value), 'binary')
  } catch {
    throw new Error('Unable to decode root: invalid base64.')
  }

  return truncateBytesToDecimal(decodedBytes, 'root')
}

const normalizeContractIdToDecimal = (hexValue: string): string => {
  const normalizedHex = hexValue.replace(/^0x/i, '').toLowerCase()

  if (!/^(?:[0-9a-f]{2})+$/.test(normalizedHex)) {
    throw new Error('Unable to normalize contractId: invalid hex.')
  }

  return truncateBytesToDecimal(Buffer.from(normalizedHex, 'hex'), 'contractId')
}

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
          baseURL: config.API_ENDPOINT,
          url: '/v1/asset-verifier/merkle-tree/current-root',
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
      const rootDecimal = decodeRootToDecimal(response.data.root)
      const contractIdDecimal = normalizeContractIdToDecimal(response.data.contractId)
      const providerIndicatedTimeUnixMs = Date.parse(response.data.computedAt)

      if (Number.isNaN(providerIndicatedTimeUnixMs)) {
        throw new Error('Unable to parse computedAt: invalid timestamp.')
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
