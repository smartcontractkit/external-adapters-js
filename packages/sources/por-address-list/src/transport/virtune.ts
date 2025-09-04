import {
  HttpTransport,
  HttpTransportConfig,
} from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/virtune'

interface ResponseSchema {
  accountName: string
  result: {
    symbol: string
    totalBalance: string
    totalBalanceUsd: string
    wallets: {
      address: string
      symbol: string
      custody: string
      name: string
      isStakingWallet: boolean
    }[]
  }[]
  count: number
  lastUpdatedAt: string
}

export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: ResponseSchema
  }
}

const getAddresses = ({
  data,
  network,
  chainId,
}: {
  data: ResponseSchema
  network: string
  chainId: string
}) => {
  return data.result.flatMap((r) =>
    r.wallets.map((wallet) => ({
      address: wallet.address,
      network,
      chainId,
    })),
  )
}

const transportConfig: HttpTransportConfig<HttpTransportTypes> = {
  prepareRequests: (params, config) => {
    return params.map((param) => ({
      params: [param],
      request: {
        baseURL: config.VIRTUNE_API_URL,
        url: param.accountId,
        params: {
          key: config.VIRTUNE_API_KEY,
        },
      },
    }))
  },
  parseResponse: (params, response) => {
    const [param] = params
    if (!response.data) {
      return [
        {
          params: param,
          response: {
            errorMessage: `The data provider didn't return any data for virtune`,
            statusCode: 502,
          },
        },
      ]
    }

    const addresses = getAddresses({
      data: response.data,
      network: param.network,
      chainId: param.chainId,
    })

    if (addresses.length == 0) {
      return [
        {
          params: param,
          response: {
            errorMessage: `The data provider didn't return any address for virtune`,
            statusCode: 502,
          },
        },
      ]
    }

    return [
      {
        params: param,
        response: {
          result: null,
          data: {
            result: addresses,
          },
        },
      },
    ]
  },
}

// Exported for testing
export class VirtuneTransport extends HttpTransport<HttpTransportTypes> {
  constructor() {
    super(transportConfig)
  }
}

export const virtuneTransport = new VirtuneTransport()
