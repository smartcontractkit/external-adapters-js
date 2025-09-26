import { TransportGenerics } from '@chainlink/external-adapter-framework/transports'
import { TypeFromDefinition } from '@chainlink/external-adapter-framework/validation/input-params'
import { AxiosResponse } from 'axios'
import { config } from '../config'

export const getUrl = (params: { accountId: string }): string => {
  return params.accountId
}

export const filterAddresses = ({
  addresses,
  params,
}: {
  addresses: string[]
  params: { addressPattern?: string }
}): string[] => {
  const { addressPattern } = params
  if (!addressPattern) return addresses
  const re = new RegExp(addressPattern)
  return addresses.filter((address) => re.test(address))
}

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
  // getUrlFromParams is always assigned to getUrl. It's only a parameter
  // because the compiler doesn't know getUrl satisfies the type until T
  // is instantiated.
  getUrlFromParams: (params: VirtuneParams<T>) => string,
  // filterAddresses is always assigned to the exported filterAddresses.
  // It's only a parameter because the compiler doesn't know
  // filterAddresses satisfies the type until T is instantiated.
  filterAddresses: ({
    addresses,
    params,
  }: {
    addresses: string[]
    params: VirtuneParams<T>
  }) => string[],
  getResultFromAddresses: (_: {
    params: VirtuneParams<T>
    addresses: string[]
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

    const addresses = response.data.result.flatMap((r) => r.wallets.map(({ address }) => address))

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

    const filteredAddresses = filterAddresses({ addresses, params: param })

    const result = getResultFromAddresses({
      addresses: filteredAddresses,
      params: param,
    })

    return [
      {
        params: param,
        response: {
          result: null,
          data: {
            result,
          },
        },
      },
    ]
  },
})
