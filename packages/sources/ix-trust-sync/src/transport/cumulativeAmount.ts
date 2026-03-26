import {
  HttpTransport,
  HttpTransportConfig,
} from '@chainlink/external-adapter-framework/transports'
import { makeLogger, ProviderResult } from '@chainlink/external-adapter-framework/util'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { TypeFromDefinition } from '@chainlink/external-adapter-framework/validation/input-params'
import { AxiosResponse } from 'axios'
import { TypedDataDomain, TypedDataField, verifyTypedData } from 'ethers'
import { BaseEndpointTypes } from '../endpoint/cumulativeAmount'

type Params = TypeFromDefinition<BaseEndpointTypes['Parameters']>

type SqlValue =
  | {
      type: 'integer' | 'text'
      value: string
    }
  | {
      type: 'float'
      value: number
    }

interface RequestSchema {
  requests: (
    | {
        type: 'execute'
        stmt: {
          sql: string
          named_args: {
            name: string
            value: SqlValue
          }[]
        }
      }
    | {
        type: 'close'
      }
  )[]
}

interface QueryResult {
  cols: {
    name: string
    decltype: 'INTEGER' | 'TEXT' | null
  }[]
  rows: SqlValue[][]
  affected_row_count: number
  last_insert_rowid: null
  replication_index: null
  rows_read: number
  rows_written: number
  query_duration_ms: number
}

export interface ResponseSchema {
  results: (
    | {
        type: 'ok'
        response: {
          type: 'execute'
          result: QueryResult
        }
      }
    | {
        type: 'ok'
        response: {
          type: 'close'
        }
      }
  )[]
}

export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: RequestSchema
    ResponseBody: ResponseSchema
  }
}

type AttestationMessage = {
  contractAddress: string
  navContractAddress: string
  decimals: number
  amount: string
  cumulativeAmount: string
  validFrom: string
  validTo: string
  nonce: string
}

type Eip712TypedData = {
  types: {
    EIP712Domain: TypedDataField[]
  } & Record<string, TypedDataField[]>
  primaryType: string
  domain: TypedDataDomain
  message: AttestationMessage
}

const logger = makeLogger('ix-trust-sync CumulativeAmount')

const ATTESTATION_DATA_COLUMN_NAME = 'attestation_data'
const SIGNATURE_COLUMN_NAME = 'signature'

export const ATTESTATION_QUERY = `
  SELECT
    ca.attestation_data,
    ca.signature
  FROM contract_attestations ca
  JOIN contract_deployments cd ON cd.id = ca.contract_deployment_id
  WHERE ca.deleted = 0
    AND ca.status = 'active'
    AND ca.attestation_type = 'net_asset_value'
    AND LOWER(ca.attestor_address) = LOWER(:auditor_address)
    AND LOWER(cd.contract_address) = LOWER(:fractional_address)
    AND cd.chain_id = :chain_id
  ORDER BY ca.created_at DESC
  LIMIT 1`

// Validates the shape of the response and returns the query result.
const getQueryResultFromResponse = (responseData: ResponseSchema): QueryResult => {
  if (responseData.results.length !== 2) {
    throw new AdapterError({
      statusCode: 502,
      message: `Unexpected number of results returned by the data provider: ${responseData.results.length}. Expected 2 results (1 with type execute and 1 with type close).`,
    })
  }

  const [executeResult, closeResult] = responseData.results

  if (executeResult.type !== 'ok') {
    throw new AdapterError({
      statusCode: 502,
      message: `The data provider returned an error for the execute request: ${JSON.stringify(
        executeResult,
      )}`,
    })
  }

  if (executeResult.response.type !== 'execute') {
    throw new AdapterError({
      statusCode: 502,
      message: `Unexpected response type for the execute request: ${executeResult.response.type}. Expected 'execute'.`,
    })
  }

  if (closeResult.type !== 'ok') {
    throw new AdapterError({
      statusCode: 502,
      message: `The data provider returned an error for the close request: ${JSON.stringify(
        closeResult,
      )}`,
    })
  }

  if (closeResult.response.type !== 'close') {
    throw new AdapterError({
      statusCode: 502,
      message: `Unexpected response type for the close request: ${closeResult.response.type}. Expected 'close'.`,
    })
  }

  const queryResult = executeResult.response.result

  if (queryResult.rows.length !== 1) {
    throw new AdapterError({
      statusCode: 502,
      message: `Unexpected number of rows returned by the data provider: ${queryResult.rows.length}. Expected exactly 1 row.`,
    })
  }

  return queryResult
}

const getRowValue = (queryResult: QueryResult, columnName: string): SqlValue => {
  const columnIndex = queryResult.cols.findIndex((col) => col.name === columnName)
  if (columnIndex === -1) {
    throw new AdapterError({
      statusCode: 502,
      message: `Column '${columnName}' not found in query result. Columns returned by the data provider: ${queryResult.cols
        .map((col) => col.name)
        .join(', ')}`,
    })
  }
  return queryResult.rows[0][columnIndex]
}

const getRowStringValue = (queryResult: QueryResult, columnName: string): string => {
  const value = getRowValue(queryResult, columnName)
  if (value.type !== 'text') {
    throw new AdapterError({
      statusCode: 502,
      message: `Unexpected type for column '${columnName}': ${value.type}. Expected 'text'.`,
    })
  }
  return value.value
}

const removeEip712Domain = (types: Eip712TypedData['types']): Record<string, TypedDataField[]> => {
  const { EIP712Domain, ...rest } = types
  return rest
}

const verifySignature = ({
  eip712AttestationData,
  signature,
  expectedAddress,
}: {
  eip712AttestationData: Eip712TypedData
  signature: string
  expectedAddress: string
}): void => {
  const { domain, message } = eip712AttestationData
  const types = removeEip712Domain(eip712AttestationData.types)
  const signerAddress = verifyTypedData(domain, types, message, signature)
  if (signerAddress.toLowerCase() !== expectedAddress.toLowerCase()) {
    throw new AdapterError({
      statusCode: 502,
      message: `Signature verification failed. Expected signer address ${expectedAddress}, but got ${signerAddress}`,
    })
  }
}

const handleResponse = (
  params: Params,
  responseData: ResponseSchema,
): ProviderResult<HttpTransportTypes> => {
  const queryResult = getQueryResultFromResponse(responseData)
  const signature = getRowStringValue(queryResult, SIGNATURE_COLUMN_NAME)
  const eip712AttestationDataJson = getRowStringValue(queryResult, ATTESTATION_DATA_COLUMN_NAME)
  const eip712AttestationData: Eip712TypedData = JSON.parse(eip712AttestationDataJson)

  verifySignature({ eip712AttestationData, signature, expectedAddress: params.auditorAddress })

  const { cumulativeAmount, decimals } = eip712AttestationData.message

  return {
    params,
    response: {
      result: cumulativeAmount,
      data: {
        cumulativeAmount,
        decimals,
      },
    },
  }
}

const transportConfig: HttpTransportConfig<HttpTransportTypes> = {
  prepareRequests: (params, config) => {
    return params.map((param) => {
      const { auditorAddress, fractionalContractAddress, chainId } = param
      return {
        params: [param],
        request: {
          method: 'POST',
          baseURL: config.API_ENDPOINT,
          headers: {
            Authorization: `Bearer ${config.API_KEY}`,
          },
          data: {
            requests: [
              {
                type: 'execute',
                stmt: {
                  sql: ATTESTATION_QUERY,
                  named_args: [
                    { name: 'auditor_address', value: { type: 'text', value: auditorAddress } },
                    {
                      name: 'fractional_address',
                      value: { type: 'text', value: fractionalContractAddress },
                    },
                    { name: 'chain_id', value: { type: 'integer', value: String(chainId) } },
                  ],
                },
              },
              { type: 'close' },
            ],
          },
        },
      }
    })
  },
  parseResponse: (
    params: Params[],
    response: AxiosResponse<ResponseSchema>,
  ): ProviderResult<HttpTransportTypes>[] => {
    if (!response.data) {
      return params.map((param) => {
        return {
          params: param,
          response: {
            errorMessage: `The data provider didn't return any value for ${JSON.stringify(param)}`,
            statusCode: 502,
          },
        }
      })
    }

    return params.map((param) => {
      try {
        return handleResponse(param, response.data)
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
        const statusCode = error instanceof AdapterError ? error.statusCode : 502
        logger.error(error, errorMessage)

        return {
          params: param,
          response: {
            statusCode,
            errorMessage,
            timestamps: {
              providerDataRequestedUnixMs: 0,
              providerDataReceivedUnixMs: 0,
              providerIndicatedTimeUnixMs: undefined,
            },
          },
        }
      }
    })
  },
}

// Exported for testing
export class CumulativeAmountHttpTransport extends HttpTransport<HttpTransportTypes> {
  constructor() {
    super(transportConfig)
  }
}

export const httpTransport = new CumulativeAmountHttpTransport()
