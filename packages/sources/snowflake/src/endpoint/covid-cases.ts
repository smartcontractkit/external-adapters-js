import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, InputParameters } from '@chainlink/types'
import { buildSnowflakeJWT } from '../util'

export const supportedEndpoints = ['covid-cases']

export const inputParameters: InputParameters = {
  state: ['state'],
  county: ['county'],
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const state = validator.validated.data.state
  const county = validator.validated.data.county

  const jwtToken = buildSnowflakeJWT({
    privateKey: config.api.privateKey,
    qualifiedUsername: config.api.qualifiedUsername,
  })

  const response = await Requester.request({
    baseURL: config.api.baseURL,
    url: '/statements',
    method: 'POST',
    data: {
      database: config.api.database,
      schema: config.api.schema,
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

  response.data.result = Requester.validateResultNumber(response.data, ['data', '0', '0'])
  return Requester.success(jobRunID, response, config.verbose)
}
