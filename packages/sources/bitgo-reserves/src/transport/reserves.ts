import {
  HttpTransport,
  HttpTransportConfig,
  TransportDependencies,
} from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/reserves'
import * as crypto from 'crypto'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'

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
  endpoint!: string

  constructor(config: HttpTransportConfig<HttpTransportTypes>) {
    super(config)
  }

  override async initialize(
    dependencies: TransportDependencies<HttpTransportTypes>,
    adapterSettings: HttpTransportTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this.pubkey = adapterSettings.VERIFICATION_PUBKEY.replace(/\\n/g, '\n')
    this.endpoint = adapterSettings.API_ENDPOINT
  }
}

export const getCreds = (client: string, defaultEndpoint: string, defaultKey: string) => {
  if (client == 'gousd' && defaultKey.length != 0) {
    return {
      endpoint: defaultEndpoint,
      key: defaultKey,
    }
  } else {
    const apiEndpointName = `${client.toUpperCase()}_API_ENDPOINT`
    const pubKeyName = `${client.toUpperCase()}_VERIFICATION_PUBKEY`
    const endpoint = process.env[apiEndpointName]
    const pubKey = process.env[pubKeyName]
    if (!endpoint || !pubKey) {
      throw new AdapterInputError({
        statusCode: 400,
        message: `Missing '${apiEndpointName}' or '${pubKeyName}' environment variables.`,
      })
    }
    return {
      endpoint: endpoint,
      key: pubKey.replace(/\\n/g, '\n'),
    }
  }
}

export const httpTransport = new ReservesHttpTransport({
  prepareRequests: (params, config) => {
    return params.map((param) => {
      const endpoint = getCreds(param.client, config.API_ENDPOINT, httpTransport.pubkey)
        .endpoint as string
      return {
        params: [param],
        request: {
          baseURL: endpoint,
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
    const verified = verifier.verify(
      getCreds(params[0].client, httpTransport.endpoint, httpTransport.pubkey).key,
      payload.dataSignature,
      'base64',
    )
    if (!verified) {
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
