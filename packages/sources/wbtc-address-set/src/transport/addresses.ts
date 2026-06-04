import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/addresses'

const PAGE_SIZE = 500

interface AddressEntry {
  id: string
  address: string
  balance?: string
  type: 'custodial' | 'merchant' | 'deposit'
}

export interface ResponseSchema {
  data: AddressEntry[]
  total: number
  pageIndex: number
  pageSize: number
}

export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: ResponseSchema
  }
}

const mapCustodialAddress = (address: AddressEntry) => ({
  id: address.id,
  address: address.address,
  balance: address.balance,
  type: address.type,
  coin: 'btc',
  chainId: 'mainnet',
  network: 'bitcoin',
})

export const httpTransport = new HttpTransport<HttpTransportTypes>({
  prepareRequests: (params, config) => {
    return [
      {
        params,
        request: {
          baseURL: config.ADDRESSES_ENDPOINT,
          params: {
            pageSize: PAGE_SIZE,
            pageIndex: 1,
          },
        },
      },
    ]
  },
  parseResponse: (params, response) => {
    const { data, total } = response.data

    if (total > data.length) {
      throw new Error(
        `wBTC custodial addresses API returned ${data.length} of ${total} addresses; increase PAGE_SIZE (currently ${PAGE_SIZE}) or add pagination`,
      )
    }

    const result = data
      .filter((a) => a.type == 'custodial' && a.balance && Number(a.balance) > 0)
      .map(mapCustodialAddress)

    return [
      {
        params: params[0],
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
