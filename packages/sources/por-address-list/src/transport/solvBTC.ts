import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/solvBTC'
import { PoRAddress } from '@chainlink/external-adapter-framework/adapter/por'

interface ResponseSchema {
  accountName: string
  result: {
    id: number
    // BTC
    address?: string
    symbol?: string
    addressType?: string
    walletName?: string
    // JUP on CEFFU
    mirrorXLinkId?: string
    label?: string
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
export const solvHttpTransport = new HttpTransport<HttpTransportTypes>({
  prepareRequests: (params, config) => {
    return params.map((param) => {
      const baseURL = (function () {
        switch (param.type) {
          case 'BTC':
            return config.SOLVBTC_API_ENDPOINT
          case 'BBN':
            return config.SOLVBTC_BBN_API_ENDPOINT
          case 'ENA':
            return config.SOLVBTC_ENA_API_ENDPOINT
          case 'CORE':
            return config.SOLVBTC_CORE_API_ENDPOINT
          case 'JUP':
            return config.SOLVBTC_JUP_API_ENDPOINT
        }
      })()
      return {
        params: [param],
        request: { baseURL },
      }
    })
  },
  parseResponse: (params, response) => {
    const timestamps = {
      providerIndicatedTimeUnixMs: new Date(response.data.lastUpdatedAt).getTime(),
    }

    if (!response.data || response.data.result.length == 0) {
      return [
        {
          params: params[0],
          response: {
            errorMessage: `The data provider didn't return any address for solvBTCs ${params[0].type}`,
            statusCode: 502,
            timestamps: timestamps,
          },
        },
      ]
    }

    const addresses = response.data.result
      .map((r) => {
        if (params[0].type == 'JUP') {
          return {
            address: r.mirrorXLinkId,
            network: 'ceffu',
            chainId: 'solv',
          } as PoRAddress
        } else {
          return {
            address: r.address,
            network: 'bitcoin',
            chainId: 'mainnet',
          } as PoRAddress
        }
      })
      .sort()

    return [
      {
        params: params[0],
        response: {
          result: null,
          data: {
            result: addresses,
          },
          timestamps: timestamps,
        },
      },
    ]
  },
})
