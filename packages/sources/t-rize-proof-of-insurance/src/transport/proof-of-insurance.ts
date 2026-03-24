import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/proof-of-insurance'

const POSITIVE_INT192_MAX = (1n << 191n) - 1n

const toPositiveInt192 = (
  hexValue: string,
  sourceField: 'root' | 'contractId',
  targetField: 'navPerShare' | 'aum',
): string => {
  const normalizedHex = hexValue.startsWith('0x') ? hexValue.slice(2) : hexValue

  if (!normalizedHex) {
    throw new Error(`Unable to map ${sourceField} to ${targetField}: decoded value is empty.`)
  }

  const value = BigInt(`0x${normalizedHex}`)

  if (value > POSITIVE_INT192_MAX) {
    throw new Error(
      `Unable to map ${sourceField} to ${targetField}: truncated value does not fit positive int192.`,
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
            owner_party_id: param.owner_party_id,
            tree_id: param.tree_id,
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
            errorMessage: `The data provider didn't return any value for owner_party_id=${param.owner_party_id}, tree_id=${param.tree_id}`,
            statusCode: 502,
          },
        }
      })
    }

    if (response.data?.error) {
      return params.map((param) => {
        return {
          params: param,
          response: {
            errorMessage: response.data.error ?? 'Unknown provider error',
            statusCode: 502,
          },
        }
      })
    }

    let navPerShare: string
    let aum: string

    try {
      const rootBytes = Buffer.from(response.data.root, 'base64')
      const navPerShareHex = rootBytes.subarray(0, 24).toString('hex')
      navPerShare = toPositiveInt192(navPerShareHex, 'root', 'navPerShare')

      const contractIdHex = response.data.contractId
      const aumHex = contractIdHex.slice(0, 48)
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

    const navDate = (BigInt(new Date(response.data.computedAt).getTime()) * 1_000_000n).toString()

    return params.map((param) => {
      return {
        params: param,
        response: {
          result: navPerShare,
          data: {
            navPerShare,
            aum,
            navDate,
            ripcord: 0,
          },
        },
      }
    })
  },
})
