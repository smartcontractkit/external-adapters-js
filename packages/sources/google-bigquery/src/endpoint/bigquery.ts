import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, InputParameters } from '@chainlink/ea-bootstrap'
import { Config } from '../config'
import { BigQuery, BigQueryOptions } from '@google-cloud/bigquery'

export const supportedEndpoints = ['bigquery']

export type TInputParameters = { query: string; params?: Record<string, string>; location?: string }
export const inputParameters: InputParameters<TInputParameters> = {
  query: {
    required: true,
    description: 'The query to run',
    type: 'string',
  },
  params: {
    required: false,
    description:
      "Optional params to use in the query. See Google BigQuery's [documentation](https://googleapis.dev/nodejs/bigquery/latest/BigQuery.html#query) for more details.",
    type: 'object',
  },
  location: {
    required: false,
    description: 'Defaults to the LOCATION env var if not present.',
    type: 'string',
  },
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  Requester.logConfig(config)

  const jobRunID = validator.validated.id
  const query = validator.validated.data.query
  const params = validator.validated.data.params || []
  const location = validator.validated.data.location || config.location

  const bqOptions: BigQueryOptions = {
    ...config,
    location,
  }

  const bigqueryClient = new BigQuery(bqOptions)

  const [rows] = await bigqueryClient.query({ query, params })
  const response = { data: { result: rows } }

  return Requester.success(jobRunID, response, true)
}
