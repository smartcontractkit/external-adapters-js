import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { ProviderResult } from '@chainlink/external-adapter-framework/util'
import dotenv from 'dotenv'
dotenv.config()

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

export const inputParameters = new InputParameters({})

const lowercaseKeys = <T extends Record<string, any>>(
  obj: T,
): { [K in Lowercase<string & keyof T>]: T[keyof T] } => {
  return Object.keys(obj).reduce((acc, key) => {
    acc[key.toLowerCase() as Lowercase<string & keyof T>] = obj[key]
    return acc
  }, {} as { [K in Lowercase<string & keyof T>]: T[keyof T] })
}

export const totalReserveTransport = new HttpTransport<TotalReserveTransportTypes>({
  prepareRequests: (params, adapterSettings) => {
    const {
      API_ENDPOINT,
      API_KEY,
      BISCUIT_ATTESTATIONS,
      BISCUIT_BLOCKCHAINS,
      CHAIN_ID,
      ASSET_CONTRACT_ADDRESS,
      TOKEN_CONTRACT_ADDRESS,
      NAMESPACE,
    } = adapterSettings

    if (!BISCUIT_ATTESTATIONS || !BISCUIT_BLOCKCHAINS) {
      throw new Error('BISCUIT_ATTESTATIONS and BISCUIT_BLOCKCHAINS must be defined')
    }
    const sql = `SELECT sum(a.fractional_amount) as TOTAL_RESERVE FROM (SELECT a.asset_contract_address, a.token_id, a.fractional_token_contract_address, a.fractional_amount, b.chain_id FROM ${NAMESPACE}.attestations a JOIN ${NAMESPACE}.blockchains b ON a.blockchain_id = b.id WHERE b.chain_id = '${CHAIN_ID}' AND a.fractional_token_contract_address = '${TOKEN_CONTRACT_ADDRESS}' AND a.asset_contract_address = '${ASSET_CONTRACT_ADDRESS}' AND a.token_id is not null)a`
    const requestBody: SqlRequest = {
      resources: [],
      biscuits: [BISCUIT_ATTESTATIONS, BISCUIT_BLOCKCHAINS],
      sqlText: sql,
    }

    return {
      params,
      request: {
        baseURL: API_ENDPOINT,
        url: '/v1/sql',
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          apikey: API_KEY,
        },
        data: requestBody,
      },
    }
  },
  parseResponse: (_params, response): ProviderResult<TotalReserveTransportTypes>[] => {
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
        params: {},
        response: {
          data: lowercaseData,
          result: totalReserve,
        },
      },
    ]
  },
})
