import {
  HttpTransport,
  HttpTransportConfig,
  TransportDependencies,
} from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/reserves'
import * as crypto from 'crypto'
import { AdapterSettings } from '@chainlink/external-adapter-framework/config'
import {
  AdapterError,
  AdapterInputError,
} from '@chainlink/external-adapter-framework/validation/error'

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

type ReservesAdapterSettings = AdapterSettings<{
  PROD_API_ENDPOINT: { description: string; type: 'string'; default: string }
  STAGING_API_ENDPOINT: { description: string; type: 'string'; default: string }
  TEST_API_ENDPOINT: { description: string; type: 'string'; default: string }
  PROD_PUBKEY: { description: string; type: 'string'; required: true }
  STAGING_PUBKEY: { description: string; type: 'string'; required: false }
  TEST_PUBKEY: { description: string; type: 'string'; required: false }
}>

class ReservesHttpTransport extends HttpTransport<HttpTransportTypes> {
  adapterSettings!: ReservesAdapterSettings

  constructor(config: HttpTransportConfig<HttpTransportTypes>) {
    super(config)
  }

  override async initialize(
    dependencies: TransportDependencies<HttpTransportTypes>,
    adapterSettings: ReservesAdapterSettings,
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this.adapterSettings = adapterSettings
  }

  getEnvEndpoint(providerEndpoint: string): string {
    switch (providerEndpoint) {
      case 'prod':
        return this.adapterSettings.PROD_API_ENDPOINT
      case 'staging':
        return this.adapterSettings.STAGING_API_ENDPOINT
      case 'test':
        return this.adapterSettings.TEST_API_ENDPOINT
      default:
        throw new AdapterInputError({
          statusCode: 400,
          message: 'provider environment endpoint not found',
        })
    }
  }

  getEnvPubkey(providerEndpoint: string): string {
    let pubkey
    switch (providerEndpoint) {
      case 'prod':
        pubkey = this.adapterSettings.PROD_PUBKEY
        break
      case 'staging':
        pubkey = this.adapterSettings.STAGING_PUBKEY
        break
      case 'test':
        pubkey = this.adapterSettings.TEST_PUBKEY
        break
      default:
        break
    }

    if (!pubkey) {
      throw new AdapterInputError({
        statusCode: 400,
        message: 'provider environment pubkey not found',
      })
    }

    return pubkey.replace(/\\n/g, '\n')
  }
}

// returns reserves info for USDS
export const httpTransport = new ReservesHttpTransport({
  prepareRequests: (params) => {
    return params.map((param) => {
      const providerEndpoint = httpTransport.getEnvEndpoint(param.providerEndpoint) as string
      return {
        params: [param],
        request: {
          baseURL: providerEndpoint,
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

    const data = JSON.parse(payload.data) as DataSchema
    const timestamps = {
      providerIndicatedTimeUnixMs: new Date(data.lastUpdated).getTime(),
    }

    return params.map((param) => {
      const pubkey = httpTransport.getEnvPubkey(param.providerEndpoint) as string
      if (!verifier.verify(pubkey, payload.dataSignature, 'base64')) {
        return {
          params: param,
          response: {
            errorMessage: `Data verification failed`,
            statusCode: 502,
          },
        }
      }

      const result = Number(data.totalReserve)
      if (result === undefined || isNaN(result)) {
        return {
          params: param,
          response: {
            errorMessage: `Missing totalReserve`,
            statusCode: 502,
          },
        }
      }

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
