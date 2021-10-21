import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, InputParameters } from '@chainlink/types'

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
  value: number
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
    }
    Error: {
      APIErrorDescription: string
      APIErrorCode: string
      ErrorDetail: {
        Description: string
      }
    }
  }
  result: number
}

const customError = (data: any) => data.Response === 'Error'

export const inputParameters: InputParameters = {
  series: false,
  last: false,
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const year = new Date().getFullYear()
  const series = validator.validated.data.series || 'DPCERG'
  const last = validator.validated.data.last || 3
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
      const date = element.TimePeriod.split('M')
      const year = date[0]
      const month = date[1]
      values.push({
        value: Number(element.DataValue),
        year: year,
        month: month,
      })
    }
  })

  // Decreasing sort by year and month
  values.sort((a, b) =>
    a.year < b.year ? 1 : a.year === b.year ? (a.month < b.month ? 1 : -1) : -1,
  )

  let sum = 0
  let count = 0
  for (let i = 0; values.length > 0 && count < last; i++) {
    sum += values[count].value
    count += 1
  }

  response.data.result = sum / count
  const result = Requester.validateResultNumber(response.data, ['result'])
  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
