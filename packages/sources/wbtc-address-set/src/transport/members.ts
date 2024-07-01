import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/addresses'

export interface ResponseSchema {
  result: {
    id: string
    token: string
    tags: string[]
    name: string
    addresses: Address[]
    description: string
    merchantPortalUri?: string
    websiteUri?: string
  }[]
  count: number
}

type Address = {
  address: string
  verified: boolean
  type: 'custodial' | 'merchant' | 'deposit'
  date: string
  chain: 'btc' | 'eth'
  balance?: string
}

export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: ResponseSchema
  }
}
export const httpTransport = new HttpTransport<HttpTransportTypes>({
  prepareRequests: (params, config) => {
    return {
      params,
      request: { baseURL: config.MEMBERS_ENDPOINT },
    }
  },
  parseResponse: (params, response) => {
    const result = response.data.result
      .filter((member) => member.token === 'wbtc')
      .flatMap((member) => member.addresses)
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
