import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, InputParameters } from '@chainlink/ea-bootstrap'
import Decimal from 'decimal.js'

export const supportedEndpoints = ['average']

export type DataSchema = {
  TableName: string
  SeriesCode: string
  LineNumber: string
  LineDescription: string
  TimePeriod: string
  METRIC_NAME: string
  CL_UNIT: string
  UNIT_MULT: string
  DataValue: string
  NoteRef: string
}

export type ValueSchema = {
  value: Decimal
  year: string
  month: string
}

export interface ResponseSchema {
  BEAAPI: {
    Request: {
      RequestParam: [
        {
          ParameterName: string
          ParameterValue: string
        },
      ]
    }
    Results: {
      Statistic: string
      UTCProductionTime: string
      Dimensions: [
        {
          Ordinal: string
          Name: string
          DataType: string
          IsValue: string
        },
      ]
      Data: DataSchema[]
      Notes: [
        {
          NoteRef: string
          NoteText: string
        },
      ]
      Error: Record<string, unknown>
    }
    Error: {
      APIErrorDescription: string
      APIErrorCode: string
      ErrorDetail: {
        Description: string
      }
    }
  }
  result: Decimal
}

const customError = (data: ResponseSchema) =>
  Object.keys(data?.BEAAPI?.Results?.Error || {}).length > 0

export type TInputParameters = { series: string; last: number }

export const inputParameters: InputParameters<TInputParameters> = {
  series: {
    description: 'The series code to query (`DGDSRG`, `DPCERG`, etc.)',
    type: 'string',
    default: 'DPCERG',
  },
  last: {
    description: 'The last N months to query',
    type: 'number',
    default: 3,
  },
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  const year = new Date().getFullYear()
  const series = validator.validated.data.series
  const last = validator.validated.data.last
  const url = `/data`

  const defaultParams = {
    DataSetName: 'NIPA',
    TableName: 'T20804',
    ResultFormat: 'json',
    method: 'getData',
    Frequency: 'M',
    year: `${year},${year - 1}`,
  }

  const params = {
    userID: config.apiKey,
    ...defaultParams,
  }

  const options = { ...config.api, params, url }
  const response = await Requester.request<ResponseSchema>(options, customError)
  const values = [] as ValueSchema[]
  response.data.BEAAPI.Results.Data.forEach((element: DataSchema) => {
    if (element.SeriesCode === series) {
      const [year, month] = element.TimePeriod.split('M')
      values.push({
        value: new Decimal(element.DataValue),
        year: year,
        month: month,
      })
    }
  })

  // Decreasing sort by year and month
  values.sort((a, b) =>
    a.year < b.year ? 1 : a.year === b.year ? (a.month < b.month ? 1 : -1) : -1,
  )

  const count = values.length > 0 ? last : 0
  const sum = Decimal.sum(...values.slice(0, last).map((element) => element.value))
  response.data.result = count !== 0 ? sum.div(count) : new Decimal(0)

  const result = Requester.validateResultNumber(response.data, ['result'])
  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
