import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/balance'

export interface ResponseSchema {
  jsonrpc: string
  result: {
    staked: string
    stakeds: Record<string, string>
    stakedOutputs: string[]
    encoding: string
  }
  id: number
}

export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: {
      jsonrpc: string
      method: string
      params: { addresses: string[] }
    }
    ResponseBody: ResponseSchema
  }
}

const assetIdMap: Record<string, string> = {
  avalanche: 'FvwEAhmxKfeiG8SnEvq42hc6whRyY3EFYAvebMqDNDGCgxN5Z',
  'avalanche-fuji': 'U8iRqJoiJm8xZHAacmvYyZVwqQx6uDNtQeP3CQ6fcgQk3JqnK',
}

export const httpTransport = new HttpTransport<HttpTransportTypes>({
  prepareRequests: (params, config) => {
    return params.map((param) => {
      return {
        params: [param],
        request: {
          baseURL: config.P_CHAIN_RPC_URL,
          method: 'POST',
          data: {
            jsonrpc: '2.0',
            method: 'platform.getStake',
            params: { addresses: param.addresses.map(({ address }) => address) },
            id: '1',
          },
        },
      }
    })
  },
  parseResponse: (params, response) => {
    return params.map((param) => {
      const network = param.addresses[0].network
      const assetId: string = assetIdMap[network]
      const stakedValue = response.data.result.stakeds[assetId] || '0'
      return {
        params: param,
        response: {
          result: null,
          data: {
            result: [
              { addresses: param.addresses.map(({ address }) => address), balance: stakedValue },
            ],
          },
        },
      }
    })
  },
})
