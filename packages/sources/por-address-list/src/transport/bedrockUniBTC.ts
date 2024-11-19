import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { TypeFromDefinition } from '@chainlink/external-adapter-framework/validation/input-params'
import { BaseEndpointTypes } from '../endpoint/bedrockBTC'

interface ResponseSchema {
  btc: {
    type: string
    addr: string
  }[]
  evm: {
    [key: string]: {
      chain_id: number
      vault: string
      tokens: string[]
    }
  }
}

const VAULT_PLACEHOLDER = '0x0000000000000000000000000000000000000000'

export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: ResponseSchema
  }
}
export const bedrockHttpTransport = new HttpTransport<HttpTransportTypes>({
  prepareRequests: (params, config) => {
    return params.map((param) => {
      return {
        params: [param],
        request: {
          baseURL: config.BEDROCK_UNIBTC_API_ENDPOINT,
        },
      }
    })
  },
  parseResponse: (params, response) => {
    if (!response.data) {
      return [
        {
          params: params[0],
          response: {
            errorMessage: `The data provider didn't return any data for bedrockBTC`,
            statusCode: 502,
          },
        },
      ]
    }

    const addresses = getAddresses(params[0].type, response.data)

    if (addresses.length == 0) {
      return [
        {
          params: params[0],
          response: {
            errorMessage: `The data provider didn't return any ${params[0].type} address for bedrockBTC`,
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
  type: TypeFromDefinition<BaseEndpointTypes['Parameters']>['type'],
  data: ResponseSchema,
) => {
  switch (type) {
    case 'BTC':
      return data.btc
        .map((d) => ({
          address: d.addr,
          network: 'bitcoin',
          chainId: 'mainnet',
        }))
        .sort()
    case 'tokens':
      return Object.entries(data.evm)
        .map(([_, value]) => ({
          chainId: value.chain_id.toString(),
          contractAddress: value.vault,
          wallets: value.tokens.filter((t) => t != VAULT_PLACEHOLDER).sort(),
        }))
        .sort()
    case 'vault':
      return Object.entries(data.evm)
        .filter(([_, value]) => value.tokens.includes(VAULT_PLACEHOLDER))
        .map(([key, value]) => ({
          address: value.vault,
          network: key,
          chainId: value.chain_id.toString(),
        }))
        .sort()
  }
}
