import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { config } from '../config'
import { ProviderResult } from '@chainlink/external-adapter-framework/util'
import { inputParameters } from '../endpoint/total_reserve'

export interface ResponseSchema {
  TOTAL_RESERVE: number
}

export interface LowercaseResponseSchema {
  total_reserve: number
}

export interface SqlRequest {
  resources: string[]
  biscuits: string[]
  sqlText: string
}

export type TotalReserveTransportTypes = {
  Parameters: typeof inputParameters.definition
  Response: {
    Data: LowercaseResponseSchema
    Result: number
  }
  Settings: typeof config.settings
  Provider: {
    RequestBody: SqlRequest
    ResponseBody: ResponseSchema[]
  }
}

const lowercaseKeys = <T extends Record<string, any>>(
  obj: T,
): { [K in Lowercase<string & keyof T>]: T[keyof T] } => {
  return Object.keys(obj).reduce((acc, key) => {
    acc[key.toLowerCase() as Lowercase<string & keyof T>] = obj[key]
    return acc
  }, {} as { [K in Lowercase<string & keyof T>]: T[keyof T] })
}

export const totalReserveTransport = new HttpTransport<TotalReserveTransportTypes>({
  prepareRequests: (params, config) => {
    return params.map((param) => {
      if (!param.BISCUIT_ATTESTATIONS || !param.BISCUIT_BLOCKCHAINS) {
        throw new Error('BISCUIT_ATTESTATIONS and BISCUIT_BLOCKCHAINS must be defined')
      }
      const sql = `SELECT sum(a.fractional_amount) as TOTAL_RESERVE FROM (SELECT a.asset_contract_address, a.token_id, a.fractional_token_contract_address, a.fractional_amount, b.chain_id FROM ${param.NAMESPACE}.attestations a JOIN ${param.NAMESPACE}.blockchains b ON a.blockchain_id = b.id WHERE b.chain_id = '${param.CHAIN_ID}' AND a.fractional_token_contract_address = '${param.TOKEN_CONTRACT_ADDRESS}' AND a.asset_contract_address = '${param.ASSET_CONTRACT_ADDRESS}' AND a.token_id is not null)a`
      const requestBody: SqlRequest = {
        resources: [],
        biscuits: [param.BISCUIT_ATTESTATIONS, param.BISCUIT_BLOCKCHAINS],
        sqlText: sql,
      }

      return {
        params: [param],
        request: {
          baseURL: config.API_ENDPOINT,
          url: '/v1/sql',
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            apikey: config.API_KEY,
          },
          data: requestBody,
        },
      }
    })
  },
  parseResponse: (params, response): ProviderResult<TotalReserveTransportTypes>[] => {
    const responseData = response.data as ResponseSchema[]
    if (!Array.isArray(responseData) || responseData.length === 0) {
      throw new Error('Invalid response format')
    }
    const totalReserve = responseData[0].TOTAL_RESERVE
    if (typeof totalReserve !== 'number') {
      throw new Error('Invalid TOTAL_RESERVE value')
    }

    const lowercaseData = lowercaseKeys(responseData[0])

    return [
      {
        params: params[0],
        response: {
          data: lowercaseData,
          result: totalReserve,
        },
      },
    ]
  },
})
