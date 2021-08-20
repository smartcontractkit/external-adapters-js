import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, ExecuteFactory } from '@chainlink/types'
import { Config, makeConfig } from './config'
import { BigQuery, BigQueryOptions } from '@google-cloud/bigquery'

const inputParams = {
  query: true,
  params: false,
  location: false,
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParams)
  if (validator.error) throw validator.error

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

export const makeExecute: ExecuteFactory<Config> = (config) => {
  return async (request, context) => execute(request, context, config || makeConfig())
}
