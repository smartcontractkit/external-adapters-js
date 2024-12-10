import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/reserves'
import * as crypto from 'crypto'

export interface DataSchema {
  totalReserve: string
  cashReserve: string
  investedReserve: string
  lastUpdated: string
}

export interface ResponseSchema {
  data: string // formatted & escaped DataSchema
  dataSignature: string
  ripcord: boolean
}

export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: ResponseSchema
  }
}

// returns reserves info for USDS
export const httpTransport = new HttpTransport<HttpTransportTypes>({
  prepareRequests: (params, config) => {
    return params.map((param) => {
      return {
        params: [param],
        request: {
          baseURL: config.API_ENDPOINT2,
        },
      }
    })
  },
  parseResponse: (params, response, adapterSettings) => {
    const payload = response.data

    if (!payload || !payload.data) {
      return params.map((param) => {
        return {
          params: param,
          response: {
            errorMessage: `The data provider didn't return any value`,
            statusCode: 502,
          },
        }
      })
    }

    if (payload.ripcord) {
      return [
        {
          params: params[0],
          response: {
            errorMessage: 'Ripcord indicator true',
            ripcord: response.data.ripcord,
            statusCode: 502,
          },
        },
      ]
    }

    const publicKey = adapterSettings.VERIFICATION_PUBKEY
    const verifier = crypto.createVerify('sha256')
    verifier.update(payload.data)
    if (!verifier.verify(publicKey, payload.dataSignature, 'base64')) {
      return params.map((param) => {
        return {
          params: param,
          response: {
            errorMessage: `Data verification failed`,
            statusCode: 502,
          },
        }
      })
    }

    const data = JSON.parse(payload.data) as DataSchema
    const timestamps = {
      providerIndicatedTimeUnixMs: new Date(data.lastUpdated).getTime(),
    }

    return params.map((param) => {
      const result = Number(data.totalReserve)
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
})
