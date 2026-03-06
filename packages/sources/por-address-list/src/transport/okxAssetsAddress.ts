import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { TypeFromDefinition } from '@chainlink/external-adapter-framework/validation/input-params'
import { BaseEndpointTypes } from '../endpoint/okxAssetsAddress'

interface ResponseSchema {
  code: number
  data: {
    dataTime: number
    lockAddresses: {
      address: string
    }[]
    stakingBalanceDetails: {
      address: string
    }[]
  }
  detailMsg: string
  error_code: string
  error_message: string
  msg: string
}

export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: ResponseSchema
  }
}
export const okxAssetsAddressHttpTransport = new HttpTransport<HttpTransportTypes>({
  prepareRequests: (params, config) => {
    return params.map((param) => {
      return {
        params: [param],
        request: {
          baseURL: config.OKX_X_ASSET_API_URL,
          params: { mintedCoinName: param.coin },
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
            errorMessage: `The data provider didn't return any data for OKX ${params[0].coin}`,
            statusCode: 502,
          },
        },
      ]
    }

    if (response.data.error_code !== '0') {
      return [
        {
          params: params[0],
          response: {
            errorMessage: `Error code ${response.data.error_code}: ${response.data.error_message}`,
            statusCode: 502,
          },
        },
      ]
    }

    const addresses = getAddresses(params[0].addressField, response.data)

    if (addresses.length === 0) {
      return [
        {
          params: params[0],
          response: {
            errorMessage: `The data provider didn't return any ${params[0].addressField} for OKX ${params[0].coin}`,
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
            result: addresses.map((address) => ({
              address,
              network: params[0].network,
              chainId: params[0].chainId,
            })),
          },
        },
      },
    ]
  },
})

const getAddresses = (
  type: TypeFromDefinition<BaseEndpointTypes['Parameters']>['addressField'],
  data: ResponseSchema,
) => {
  switch (type) {
    case 'lockAddresses':
      return (data.data.lockAddresses ?? []).map((item) => item.address)
    case 'stakingBalanceDetails':
      return (data.data.stakingBalanceDetails ?? []).map((item) => item.address)
    default:
      return []
  }
}
