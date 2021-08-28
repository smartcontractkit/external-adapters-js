import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, InputParameters } from '@chainlink/types'

export const supportedEndpoints = ['series']

export const endpointResultPaths = {
  example: 'series',
}

export interface ResponseSchema {
  status: string
  responseTime: number
  message: []
  Results: {
    series: [
      {
        seriesId: string
        data: [DataSchema]
      },
    ]
  }
}

export interface DataSchema {
  year: string
  period: string
  periodName: string
  latest: string
  value: string
  footnotes: []
}

const customError = (data: any) => data.Response === 'Error'

export const inputParameters: InputParameters = {
  serie: false,
  year: false,
  month: false,
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const serie = validator.validated.serie || 'CUSR0000SA0'
  const year = validator.validated.data.year
  const month = validator.validated.data.month
    ? capitalizeFirstLetter(validator.validated.data.month)
    : ''
  const url = `/timeseries/data/${serie}`
  const options = { ...config.api, url }
  const response = await Requester.request<ResponseSchema>(options, customError)
  const data = response.data.Results.series[0].data

  let filter
  if (!year && !month) {
    filter = data.filter((obj: DataSchema) => {
      return obj['latest'] === 'true'
    })
  } else {
    filter = data.filter((obj: DataSchema) => {
      return obj['year'] === year && obj['periodName'] === month
    })
  }
  const result = round(Requester.validateResultNumber(filter, [0, 'value']), 1)
  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}

const capitalizeFirstLetter = (string: string) => {
  return string.charAt(0).toUpperCase() + string.slice(1)
}

const round = (value: number, precision: number) => {
  const multiplier = Math.pow(10, precision || 0)
  return Math.round(value * multiplier) / multiplier
}
