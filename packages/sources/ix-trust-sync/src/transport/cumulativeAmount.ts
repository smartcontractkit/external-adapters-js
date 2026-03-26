import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { makeLogger, ProviderResult } from '@chainlink/external-adapter-framework/util'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { TypeFromDefinition } from '@chainlink/external-adapter-framework/validation/input-params'
import { AxiosResponse } from 'axios'
import { verifyTypedData } from 'ethers'
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

const logger = makeLogger('ix-trust-sync CumulativeAmount')

const ATTESTATION_QUERY = `WITH latest_attestation AS (
  SELECT
    ca.contract_deployment_id,
    ca.attestor_address,
    ca.attestation_data,
    ca.signature,
    ca.created_at                      AS attestor_timestamp,
    json_extract(ca.attestation_data, '$.message.navContractAddress')  AS nav_contract_address,
    json_extract(ca.attestation_data, '$.message.decimals')            AS attested_decimals,
    json_extract(ca.attestation_data, '$.message.cumulativeAmount')    AS cumulative_amount_wei
  FROM contract_attestations ca
  JOIN contract_deployments cd ON cd.id = ca.contract_deployment_id
  WHERE ca.deleted = 0
    AND ca.status = 'active'
    AND ca.attestation_type = 'net_asset_value'
    AND LOWER(ca.attestor_address) = LOWER(:auditor_address)
    AND LOWER(cd.contract_address) = LOWER(:fractional_address)
    AND cd.chain_id = :chain_id
  ORDER BY ca.created_at DESC
  LIMIT 1
)
SELECT
  frac_cd.chain_id,
  frac_cd.contract_address                       AS fractional_contract_address,
  frac_cd.contract_name                          AS fractional_unit,
  la.nav_contract_address,
  nav_cd.contract_address                        AS nav_contract_address_verified,
  la.attested_decimals,
  la.cumulative_amount_wei,
  CAST(la.cumulative_amount_wei AS REAL) / POWER(10, la.attested_decimals) AS cumulative_amount_human,
  la.attestor_address                            AS auditor_account_address,
  la.signature                                   AS auditor_signature,
  la.attestation_data,
  la.attestor_timestamp
FROM latest_attestation la
JOIN contract_deployments frac_cd ON frac_cd.id = la.contract_deployment_id
JOIN contract_deployments nav_cd  ON LOWER(nav_cd.contract_address) = LOWER(la.nav_contract_address);
`

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

const handleResponse = (
  params: Params,
  responseData: ResponseSchema,
): ProviderResult<HttpTransportTypes> => {
  const queryResult = getQueryResultFromResponse(responseData)

  const signature = getRowStringValue(queryResult, 'auditor_signature')

  console.log('dskloetx signature', signature)

  const eip712AttestationDataJson = getRowStringValue(queryResult, 'attestation_data')
  const eip712AttestationData = JSON.parse(eip712AttestationDataJson)

  //console.log('dskloetx attestationData', JSON.stringify(eip712AttestationData, null, 2))

  const {
    types: { EIP712Domain, ...types },
  } = eip712AttestationData
  const signerAddress = verifyTypedData(
    eip712AttestationData.domain,
    types,
    eip712AttestationData.message,
    signature,
  )

  console.log(
    'dskloetx signerAddress',
    signerAddress,
    'expected auditorAddress',
    params.auditorAddress,
  )
  if (signerAddress.toLowerCase() !== params.auditorAddress.toLowerCase()) {
    throw new AdapterError({
      statusCode: 502,
      message: `Signature verification failed. Expected signer address ${params.auditorAddress}, but got ${signerAddress}`,
    })
  }

  const { cumulativeAmount, decimals } = eip712AttestationData.message
  const result = cumulativeAmount

  return {
    params,
    response: {
      result,
      data: {
        cumulativeAmount,
        decimals,
      },
    },
  }
}

export const httpTransport = new HttpTransport<HttpTransportTypes>({
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

    //console.log('dskloetx response', JSON.stringify(response.data, null, 2))

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
})
