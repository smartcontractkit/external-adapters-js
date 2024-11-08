import { BaseEndpointTypes } from '../endpoint/address'
import { TypeFromDefinition } from '@chainlink/external-adapter-framework/validation/input-params'

type Param = TypeFromDefinition<BaseEndpointTypes['Parameters']>

export interface BedrockUniBtcResponseSchema {
  btc: string[]
  evm: {
    [key: string]: string
  }
}

export const prepareBedrockUniBtcRequest = (
  param: Param,
  config: BaseEndpointTypes['Settings'],
) => {
  return {
    params: [param],
    request: {
      baseURL: config.BEDROCK_UNIBTC_API_ENDPOINT,
      params: {},
    },
  }
}

export const parseBedrockUniBtcResponse = (param: Param, response: BedrockUniBtcResponseSchema) => {
  if (response.btc.length == 0) {
    return {
      params: param,
      response: {
        errorMessage: `The data provider didn't return any address for ${param.client}`,
        statusCode: 502,
      },
    }
  }

  const addresses = response.btc
    .map((adr) => ({
      address: adr,
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
    },
  }
}
