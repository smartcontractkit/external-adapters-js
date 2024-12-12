import {
  HttpTransport,
  HttpTransportConfig,
  TransportDependencies,
} from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/reserves'
import * as crypto from 'crypto'
import { AdapterSettings } from '@chainlink/external-adapter-framework/config'

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

class ReservesHttpTransport extends HttpTransport<HttpTransportTypes> {
  pubkey!: string

  constructor(config: HttpTransportConfig<HttpTransportTypes>) {
    super(config)
  }

  override async initialize(
    dependencies: TransportDependencies<HttpTransportTypes>,
    adapterSettings: AdapterSettings<{
      API_ENDPOINT: { description: string; type: 'string'; default: string }
      VERIFICATION_PUBKEY: { description: string; type: 'string'; required: true }
    }>,
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this.pubkey = adapterSettings.VERIFICATION_PUBKEY.replace(/\\n/g, '\n')
  }
}

// returns reserves info for USDS
export const httpTransport = new ReservesHttpTransport({
  prepareRequests: (params, config) => {
    return params.map((param) => {
      return {
        params: [param],
        request: {
          baseURL: config.API_ENDPOINT,
        },
      }
    })
  },
  parseResponse: (params, response) => {
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

    const verifier = crypto.createVerify('sha256')
    verifier.update(payload.data)
    if (!verifier.verify(httpTransport.pubkey, payload.dataSignature, 'base64')) {
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
    const result = Number(data.totalReserve)
    if (result === undefined || isNaN(result)) {
      return params.map((param) => {
        return {
          params: param,
          response: {
            errorMessage: `Missing totalReserve`,
            statusCode: 502,
          },
        }
      })
    }

    return params.map((param) => {
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
