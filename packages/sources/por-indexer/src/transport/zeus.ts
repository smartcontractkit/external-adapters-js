import {
  HttpTransport,
  HttpTransportConfig,
  TransportDependencies,
} from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/zeus'

interface ResponseSchema {
  accountName: string
  result: {
    id: string
    address: string
    symbol: string
    addressType: string
    balance: string
    walletName: string
  }[]
  count: number
  totalReserveinBtc: string
  totalToken: string
  minerFees: string
  lastUpdatedAt: string
}

export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: ResponseSchema
  }
}

class ZeusBalanceTransport extends HttpTransport<HttpTransportTypes> {
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
    this.endpoint = adapterSettings.ZEUS_ZBTC_API_URL
  }
}

export const httpTransport = new ZeusBalanceTransport({
  prepareRequests: (params, config) => {
    return {
      params: params,
      request: {
        baseURL: config.ZEUS_ZBTC_API_URL,
      },
    }
  },

  parseResponse: (params, response) => {
    const payload = response.data

    if (!payload) {
      return [
        {
          params: params[0],
          response: {
            errorMessage: `The data provider didn't return any value`,
            statusCode: 502,
          },
        },
      ]
    }

    const result = payload.minerFees

    const timestamps = {
      providerIndicatedTimeUnixMs: new Date(response.data.lastUpdatedAt).getTime(),
    }

    return [
      {
        params: params[0],
        response: {
          result,
          data: {
            result,
          },
          timestamps,
        },
      },
    ]
  },
})
