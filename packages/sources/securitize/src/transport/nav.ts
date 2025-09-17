import {
  HttpTransport,
  HttpTransportConfig,
} from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/nav'

export interface SingleResponseSchema {
  assetId: string
  name: string
  nav: number
  seqNum: number
  yieldOneDay: string
  yieldSevenDay: string
  recordDate: string
  staleness: number
  signedMessage: {
    signature: string
    content: string
    hash: string
    prevHash: string
    prevSig: string
    prevContent: string
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
    if (!response.data?.docs?.[0]) {
      return params.map((param) => {
        return {
          params: param,
          response: {
            errorMessage: `The data provider didn't return any value for ${param.assetId}`,
            statusCode: 502,
          },
        }
      })
    }

    const asset = response.data.docs[0]
    const timestamps = {
      providerIndicatedTimeUnixMs: new Date(response.data.docs[0].recordDate).getTime(),
    }

    return params.map((param) => {
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
