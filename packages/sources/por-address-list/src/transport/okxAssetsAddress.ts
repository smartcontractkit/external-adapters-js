import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import {
  isValidBitcoinAddress,
  isValidEthereumAddress,
  isValidEthereumWithdrawalCredentials,
  isValidSolanaAddress,
} from '@chainlink/external-adapter-framework/validation/address'
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
      return errorResponse(
        params[0],
        `The data provider didn't return any data for OKX ${params[0].coin}`,
      )
    }

    if (response.data.error_code !== '0') {
      return errorResponse(
        params[0],
        `Error code ${response.data.error_code}: ${response.data.error_message}`,
      )
    }

    const addresses = getAddresses(params[0], response.data)

    if (addresses.length === 0) {
      return errorResponse(
        params[0],
        `The data provider didn't return any ${params[0].addressField} for OKX ${params[0].coin}`,
      )
    }

    const errors = addresses.flatMap((item) => ('error' in item ? [item.error] : []))
    if (errors.length > 0) {
      return params[0].noErrorOnRipcord
        ? [
            {
              params: params[0],
              response: {
                result: null,
                data: {
                  result: [],
                  ripcord: true,
                  ripcordDetails: errors.join('; '),
                },
              },
            },
          ]
        : errorResponse(params[0], errors.join('; '))
    }

    return [
      {
        params: params[0],
        response: {
          result: null,
          data: {
            result: addresses
              .flatMap((item) => ('address' in item ? [item.address] : []))
              .map((address) => ({
                address,
                network: params[0].network,
                chainId: params[0].chainId,
              })),
            ripcord: false,
          },
        },
      },
    ]
  },
})

const getAddresses = (
  param: TypeFromDefinition<BaseEndpointTypes['Parameters']>,
  data: ResponseSchema,
): ({ address: string } | { error: string })[] => {
  switch (param.addressField) {
    case 'lockAddresses':
    case 'stakingBalanceDetails':
      return (data.data[param.addressField] ?? []).map((item) =>
        isValidateAddress(item.address, param.network)
          ? { address: item.address }
          : { error: `Invalid ${param.network} address ${item.address} for OKX ${param.coin}` },
      )
    case 'stakingWithdrawalCredentials':
      return (data.data.stakingWithdrawalCredentials ?? []).map((item) => {
        const withdrawalCred = item.trim().toLowerCase()
        return isValidEthereumWithdrawalCredentials(withdrawalCred)
          ? { address: `0x${withdrawalCred.slice(26)}` }
          : { error: `Invalid withdrawalCred ${withdrawalCred} for OKX ${param.coin}` }
      })
    default:
      return []
  }
}

const isValidateAddress = (address: string, network: string) => {
  switch (network.toLowerCase()) {
    case 'ethereum':
      return isValidEthereumAddress(address)
    case 'bitcoin':
      return isValidBitcoinAddress(address)
    case 'solana':
      return isValidSolanaAddress(address)
    default:
      return false
  }
}

const errorResponse = (
  params: TypeFromDefinition<BaseEndpointTypes['Parameters']>,
  errorMessage: string,
) => [
  {
    params,
    response: {
      errorMessage,
      statusCode: 502,
    },
  },
]
