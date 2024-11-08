import { BaseEndpointTypes } from '../endpoint/address'
import { TypeFromDefinition } from '@chainlink/external-adapter-framework/validation/input-params'

type Param = TypeFromDefinition<BaseEndpointTypes['Parameters']>

export interface SolvBtcResponseSchema {
  accountName: string
  result: {
    id: number
    address: string
    symbol: string
    addressType: string
    walletName: string
  }[]
  count: number
  lastUpdatedAt: string
}

export const prepareSolvBtcRequest = (param: Param, config: BaseEndpointTypes['Settings']) => {
  return {
    params: [param],
    request: {
      baseURL: config.SOLVBTC_API_ENDPOINT,
      params: {},
    },
  }
}

export const parseSolvBtcResponse = (param: Param, response: SolvBtcResponseSchema) => {
  if (response.result.length == 0) {
    return {
      params: param,
      response: {
        errorMessage: `The data provider didn't return any address for ${param.client}`,
        statusCode: 502,
      },
    }
  }

  const addresses = response.result
    .map((r) => ({
      address: r.address,
      network: 'bitcoin',
      chainId: 'mainnet',
    }))
    .sort()

  return {
    params: param,
    response: {
      data: {
        result: addresses,
      },
      statusCode: 200,
      result: null,
      timestamps: {
        providerIndicatedTimeUnixMs: new Date(response.lastUpdatedAt).getTime(),
      },
    },
  }
}
