import {
  HttpTransport,
  HttpTransportConfig,
} from '@chainlink/external-adapter-framework/transports'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { BaseEndpointTypes } from '../endpoint/nav'
import { validateResponseSignature } from './sigutils'

export interface SingleResponseSchema {
  assetId: string
  name?: string
  nav: number
  seqNum: number
  yieldOneDay?: string
  yieldSevenDay?: string
  recordDate: string
  staleness?: number
  signedMessage: {
    signature: string
    content: string
    hash: string
    prevHash: string | null
    prevSig: string | null
    prevContent: string | null
  }
}

export interface ResponseSchema {
  docs: SingleResponseSchema[]
}

export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: ResponseSchema
  }
}

export function getPubKeys(assetEnvVarPrefix: string): string[] {
  const envVarName = `${assetEnvVarPrefix.toUpperCase()}_PUBKEYS`
  const pubkeys = process.env[envVarName]
  if (!pubkeys) {
    throw new AdapterInputError({
      message: `Missing env var ${envVarName}`,
      statusCode: 400,
    })
  }
  return pubkeys.split(',').map((s) => s.trim()) ?? []
}

const transportConfig: HttpTransportConfig<HttpTransportTypes> = {
  prepareRequests: (params, config) => {
    return params.map((param) => {
      return {
        params: [param],
        request: {
          baseURL: config.API_ENDPOINT,
          headers: {
            apikey: config.API_KEY,
          },
          params: {
            assetId: param.assetId,
            sortBy: 'recordDate',
            sortOrder: 'DESC',
            page: 1,
            limit: 1,
          },
        },
      }
    })
  },
  parseResponse: (params, response) => {
    const asset = response?.data?.docs?.[0]
    return params.map((param) => {
      if (!asset) {
        return {
          params: param,
          response: {
            errorMessage: `The data provider didn't return any value for ${param.assetId}`,
            statusCode: 502,
          },
        }
      }

      const timestamps = {
        providerIndicatedTimeUnixMs: new Date(response.data.docs[0].recordDate).getTime(),
      }

      const pubkeys = getPubKeys(param.envVarPrefix)
      validateResponseSignature(asset, pubkeys)

      if (asset.assetId !== param.assetId) {
        return {
          params: param,
          response: {
            errorMessage: `The data provider didn't return any value for ${param.assetId}`,
            statusCode: 502,
          },
          timestamps,
        }
      }
      const result = asset.nav
      return {
        params: param,
        response: {
          result,
          data: {
            result,
          },
          timestamps,
        },
      }
    })
  },
}

// Exported for testing
export class NavTransport extends HttpTransport<HttpTransportTypes> {
  constructor() {
    super(transportConfig)
  }
}

export const httpTransport = new NavTransport()
