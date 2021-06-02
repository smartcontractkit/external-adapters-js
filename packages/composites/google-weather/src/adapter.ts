import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteFactory, ExecuteWithConfig } from '@chainlink/types'
import * as BigQuery from '@chainlink/google-bigquery-adapter'
import { Config, makeConfig } from './config'

const customParams = {
  lat: true,
  long: true,
  dateFrom: true,
  dateTo: true,
  method: true,
  column: true,
}

export const execute: ExecuteWithConfig<Config> = async (input, config) => {
  const validator = new Validator(input, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.jobRunID
  const lat = validator.validated.data.lat
  const long = validator.validated.data.long
  const dateFrom = validator.validated.data.dateFrom
  const dateTo = validator.validated.data.dateTo
  const method = validator.validated.data.method
  const column = validator.validated.data.column

  const queryBuilder = new QueryBuilder(lat, long, dateFrom, dateTo, method, column, config.table)

  const bigQuery = BigQuery.makeExecute(BigQuery.makeConfig())
  const response = await bigQuery({ id: jobRunID, data: queryBuilder.toQuery() })
  const result = Requester.validateResultNumber(response.result, [0, "result"])
  return Requester.success(jobRunID, { data: { result } })
}

export const makeExecute: ExecuteFactory<Config> = (config) => {
  return async (request) => execute(request, config || makeConfig())
}

type Method = 'SUM' | 'AVG'

class QueryBuilder {
  private readonly lat: number
  private readonly long: number
  private readonly dateFrom: string
  private readonly dateTo: string
  private readonly method: Method
  private readonly column: string
  private readonly table: string

  constructor(lat: number, long: number, dateFrom: string, dateTo: string, method: Method, column: string, table: string) {
    this.lat = lat
    this.long = long
    this.dateFrom = dateFrom
    this.dateTo = dateTo
    this.method = method
    this.column = column
    this.table = table
  }

  private select() {
    switch (this.method) {
      case 'AVG':
        return `AVG(${this.column})`
      case 'SUM':
        return `SUM(${this.column})`
    }
  }

  public toQuery(): { query: string, params: { [key: string]: string | number }} {
    return {
      query: [
        `SELECT ${this.select()} AS result`,
        `FROM \`${this.table}\` AS w`,
        'WHERE',
        'ST_EQUALS(w.geography,',
        `(SELECT geography FROM \`${this.table}\``,
        'ORDER BY ST_DISTANCE(ST_GEOGPOINT(@lat, @long), geography)',
        'LIMIT 1))',
        'AND forecast_time >= DATE(@dateFrom)',
        'AND forecast_time < DATE(@dateTo)'
      ].join('\n'),
      params: {
        lat: this.lat,
        long: this.long,
        dateFrom: this.dateFrom,
        dateTo: this.dateTo
      }
    }
  }
}
