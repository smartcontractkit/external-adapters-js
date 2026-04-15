import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { TypeFromDefinition } from '@chainlink/external-adapter-framework/validation/input-params'
import { BaseEndpointTypes } from '../endpoint/okxAssetsAddress'

const logger = makeLogger('okx-assets-address-http-transport')

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
    stakingWithdrawalCredentials: string[]
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

    const addresses = getAddresses(params[0], response.data)

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
  param: TypeFromDefinition<BaseEndpointTypes['Parameters']>,
  data: ResponseSchema,
) => {
  switch (param.addressField) {
    case 'lockAddresses':
      return (data.data.lockAddresses ?? []).map((item) => item.address)
    case 'stakingBalanceDetails':
      return (data.data.stakingBalanceDetails ?? []).map((item) => item.address)
    case 'stakingWithdrawalCredentials':
      return (data.data.stakingWithdrawalCredentials ?? []).flatMap((item) => {
        const withdrawalCred = item.trim().toLowerCase()
        if (
          // 0x | 2 chars prefix | 22 chars padding | 40 chars address
          (withdrawalCred.startsWith('0x01') || withdrawalCred.startsWith('0x02')) &&
          withdrawalCred.length === 66
        ) {
          return [`0x${withdrawalCred.slice(26)}`]
        }
        logger.warn(`Ignore invalid withdrawal credential: ${withdrawalCred} for ${param.coin}`)
        return []
      })
    default:
      return []
  }
}
