import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, InputParameters } from '@chainlink/ea-bootstrap'
import { SnowflakeConfig } from '../config'
import { buildSnowflakeJWT } from '../util'

export const supportedEndpoints = ['covid-cases']

export const description =
  'Queries US confirmed Covid cases per County, using the John Hopkins University table from the [StarSchema COVID-19 Epidemiological dataset](https://www.snowflake.com/datasets/starschema-covid-19-epidemiological-data/).'

export type TInputParameters = { state: string; county: string }
export const inputParameters: InputParameters<TInputParameters> = {
  state: {
    required: true,
    description: 'The state of the desired county',
    type: 'string',
  },
  county: {
    required: true,
    description: 'Name of the desired county',
    type: 'string',
  },
}

type UUIDv4 = string

export interface ResponseSchema {
  resultSetMetaData: {
    numRows: number
    format: 'jsonv2'
    partitionInfo: [{ rowCount: number; uncompressedSize: number }]
    rowType: [
      {
        name: string
        database: string
        schema: string
        table: string
        type: string
        byteLength: number | null
        scale: number
        precision: number
        nullable: boolean
        collation: null
        length: number | null
      },
    ]
  }
  data: string[][] // List of rows, each row an array of requested fields
  code: string
  statementStatusUrl: `/api/statements/${UUIDv4}?requestId=${UUIDv4}`
  requestId: UUIDv4
  sqlState: number
  statementHandle: UUIDv4
  message: number
  createdOn: number
}

export const execute: ExecuteWithConfig<SnowflakeConfig> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  const state = validator.validated.data.state
  const county = validator.validated.data.county

  const jwtToken = buildSnowflakeJWT({
    privateKey: config.privateKey,
    qualifiedUsername: config.qualifiedUsername,
  })

  const response = await Requester.request<ResponseSchema>({
    baseURL: config.baseURL,
    url: '/statements',
    method: 'POST',
    data: {
      database: config.database,
      schema: config.schema,
      statement: `
        select confirmed
        from JHU_DASHBOARD_COVID_19_GLOBAL
        where country_region = 'United States'
        and province_state = :1
        and county = :2
      `,
      bindings: {
        '1': {
          type: 'TEXT',
          value: state,
        },
        '2': {
          type: 'TEXT',
          value: county,
        },
      },
      resultSetMetaData: {
        format: 'jsonv2',
      },
    },
    headers: {
      Authorization: `Bearer ${jwtToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-Snowflake-Authorization-Token-Type': 'KEYPAIR_JWT',
    },
  })

  const result = Requester.validateResultNumber(response.data, ['data', '0', '0'])
  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
