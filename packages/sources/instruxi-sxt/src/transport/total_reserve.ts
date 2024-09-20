import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/total_reserve'

export interface ResponseSchema {
  total_reserve: number
  errorMessage?: string
}

export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: ResponseSchema
  }
}

export const httpTransport = new HttpTransport<HttpTransportTypes>({
  prepareRequests: (params, adapterSettings) => {
    const sql = `SELECT sum(a.fractional_amount) as total_reserve FROM (SELECT a.asset_contract_address, a.token_id, a.fractional_token_contract_address, a.fractional_amount, b.chain_id FROM IDM.attestations a JOIN IDM.blockchains b ON a.blockchain_id = b.id WHERE b.chain_id = '43113' AND a.fractional_token_contract_address = '0x7fe755a1dc20eC83Af545bc355ad7a9564805fA9' AND a.asset_contract_address = '0xFa11d66488D1C29d36ef39426938B949822e3FBd' AND a.token_id is not null)a`
    return {
      params,
      request: {
        baseURL: adapterSettings.API_ENDPOINT,
        url: '/',
        headers: {
          accept: 'application/json',
          apikey: adapterSettings.API_KEY,
          'content-type': 'application/json',
        },
        payload: {
          resources: ['IDM.ATTESTATIONS', 'IDM.BLOCKCHAINS'],
          biscuits: [adapterSettings.BISCUIT_ATTESTATIONS, adapterSettings.BISCUIT_BLOCKCHAINS],
          sqlText: sql,
        },
        method: 'post',
        params: {},
      },
    }
  },
  parseResponse: (_params, response) => {
    if (response.data.errorMessage) {
      return [
        {
          params: {},
          response: {
            errorMessage: `There was an error from the source API. ${response.data.errorMessage}`,
            statusCode: 502,
          },
        },
      ]
    }
    if (!response.data.total_reserve && response.data.total_reserve !== 0) {
      return [
        {
          params: {},
          response: {
            errorMessage: `The data provider didn't return any value for total_reserve`,
            statusCode: 502,
          },
        },
      ]
    }

    const result = response.data.total_reserve
    return [
      {
        params: {},
        response: {
          result,
          data: {
            result,
          },
        },
      },
    ]
  },
})
