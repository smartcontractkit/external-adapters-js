import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/coinbaseCBBTC'

interface ResponseSchema {
  schema: string
  lastUpdatedAt: string
  reservesTotal: {
    amount: string
    currency: {
      name: string
    }
    network: {
      name: string
    }
  }
  reserveAddresses: {
    address: string
    balance: {
      amount: string
      currency: {
        name: string
      }
      network: {
        name: string
      }
    }
  }[]
  wrappedAssetsByNetwork: {
    amount: string
    currency: {
      name: string
      address: string
    }
    network: {
      name: string
      chainId: string
    }
  }[]
  wrappedAssetsTotal: {
    amount: string
    currency: {
      name: string
    }
  }
}

export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: ResponseSchema
  }
}

export const coinbaseHttpTransport = new HttpTransport<HttpTransportTypes>({
  prepareRequests: (params, config) => {
      return {
        params,
        request: {
          baseURL: config.COINBASE_CBBTC_API_ENDPOINT,
        },
      }
  },

  parseResponse: (params, response) => {
    if (!response.data) {
      return [
        {
          params: params[0],
          response: {
            errorMessage: `The data provider didn't return any data for coinbaseBTC`,
            statusCode: 502,
          },
        },
      ]
    }

    const addresses = getAddresses(response.data)

    if (addresses.length == 0) {
      return [
        {
          params: params[0],
          response: {
            errorMessage: `The data provider didn't return any address for coinbaseBTC`,
            statusCode: 502,
          },
        },
      ]
    }

    return [
      {
        params: params[0],
        response: {
          result: null,
          data: {
            result: addresses,
          },
        },
      },
    ]
  },
})

const getAddresses = (
  data: ResponseSchema,
) => {
      return data.reserveAddresses
        .map((d) => ({
          address: d.address,
          network: d.balance.network.name,
          chainId: 'mainnet',
        }))
        .sort()
}
