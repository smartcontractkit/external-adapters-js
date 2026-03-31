import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/proof-of-insurance'

const POSITIVE_INT192_MAX = (1n << 191n) - 1n

const toPositiveInt192 = (
  hexValue: string,
  sourceField: 'root' | 'contractId',
  targetField: 'navPerShare' | 'aum',
): string => {
  if (hexValue === '0x') {
    throw new Error(`Unable to map ${sourceField} to ${targetField}: decoded value is empty.`)
  }

  const value = BigInt(hexValue)

  if (value > POSITIVE_INT192_MAX) {
    throw new Error(
      `Unable to map ${sourceField} to ${targetField}: value does not fit positive int192.`,
    )
  }

  return value.toString()
}

export interface ResponseSchema {
  treeId: string
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

    const providerError = response.data?.error

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

    let navPerShare: string
    let aum: string

    try {
      const rootBytes = Buffer.from(response.data.root, 'base64')
      // SmartData v9 uses signed int192 fields, so we truncate to the leftmost 24 bytes (192 bits)
      // and fail fast if the sign bit is still set rather than silently truncating further.
      const navPerShareHex = `0x${rootBytes.subarray(0, 24).toString('hex')}`
      navPerShare = toPositiveInt192(navPerShareHex, 'root', 'navPerShare')

      // contractId is also mapped into an int192 field, so we apply the same 24-byte truncation rule.
      const aumHex = `0x${response.data.contractId.slice(0, 48)}`
      aum = toPositiveInt192(aumHex, 'contractId', 'aum')
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

    // SmartData v9 navDate expects a unix timestamp in nanoseconds.
    const navTimestampNanos = (
      BigInt(new Date(response.data.computedAt).getTime()) * 1_000_000n
    ).toString()

    return params.map((param) => {
      return {
        params: param,
        response: {
          result: navPerShare,
          data: {
            navPerShare,
            aum,
            navDate: navTimestampNanos,
            ripcord: 0,
          },
        },
      }
    })
  },
})
