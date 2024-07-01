import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/addresses'

export interface ResponseSchema {
  result: {
    id: string
    address: string
    balance?: string
    type: 'custodial' | 'merchant' | 'deposit'
    verified: boolean
  }[]
  count: number
}

export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: ResponseSchema
  }
}
export const httpTransport = new HttpTransport<HttpTransportTypes>({
  prepareRequests: (params, config) => {
    return [
      {
        params,
        request: { baseURL: config.ADDRESSES_ENDPOINT },
      },
    ]
  },
  parseResponse: (params, response) => {
    const result = response.data.result
      .filter((a) => a.type == 'custodial' && a.balance && Number(a.balance) > 0)
      .map((a) => ({ ...a, coin: 'btc', chainId: 'mainnet', network: 'bitcoin' }))

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
