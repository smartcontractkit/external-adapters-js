import { TransportGenerics } from '@chainlink/external-adapter-framework/transports'
import { TypeFromDefinition } from '@chainlink/external-adapter-framework/validation/input-params'
import { AxiosResponse } from 'axios'
import { config } from '../config'

export interface ResponseSchema {
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

type VirtuneTransportGenerics = TransportGenerics & {
  Parameters: {
    accountId: {
      description: 'The account ID to fetch addresses for'
      type: 'string'
      required: true
    }
  }
  Response: {
    Data: {
      result: unknown[]
    }
  }
}

export type VirtuneParams<T extends VirtuneTransportGenerics> = TypeFromDefinition<T['Parameters']>
export type VirtuneResult<T extends VirtuneTransportGenerics> = T['Response']['Data']['result']

type Config = typeof config.settings

export const createVirtuneTransportConfig = <T extends VirtuneTransportGenerics>(
  getUrlFromParams: (params: VirtuneParams<T>) => string,
  getAddressesFromResponse: (_: {
    params: VirtuneParams<T>
    data: ResponseSchema
  }) => VirtuneResult<T>,
) => ({
  prepareRequests: (params: VirtuneParams<T>[], config: Config) => {
    return params.map((param) => ({
      params: [param],
      request: {
        baseURL: config.VIRTUNE_API_URL,
        url: getUrlFromParams(param),
        params: {
          key: config.VIRTUNE_API_KEY,
        },
      },
    }))
  },
  parseResponse: (params: VirtuneParams<T>[], response: AxiosResponse<ResponseSchema>) => {
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

    const addresses = getAddressesFromResponse({
      data: response.data,
      params: param,
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
})
