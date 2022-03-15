import { Requester, util, Validator } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, InputParameters } from '@chainlink/types'

export const supportedEndpoints = ['series']

export const endpointResultPaths = {
  series: 'value',
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

export const inputParameters: InputParameters = {
  serie: {
    required: false,
    description: 'The US CPI Data serieID (`CUSR0000SA0`, `LNS14000000`, etc)',
    default: 'CUSR0000SA0',
    type: 'string',
  },
  year: {
    required: false,
    description:
      'The year serie filter (`2021`, `2020`, etc). It is mandatory to specify the `month` and `year` values together.',
    type: 'string',
  },
  month: {
    required: false,
    description:
      'The month serie filter  `may`, `july`, etc. It is mandatory to specify the `month` and `year` values together.',
    type: 'string',
  },
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  const serie = validator.validated.data.serie || 'CUSR0000SA0'
  const year = validator.validated.data.year
  const month = validator.validated.data.month
    ? capitalizeFirstLetter(validator.validated.data.month)
    : ''
  const resultPath = validator.validated.data.resultPath || 'value'

  const url = util.buildUrlPath('/timeseries/data/:serie', { serie })
  const options = { ...config.api, url }
  const response = await Requester.request<ResponseSchema>(options)
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
  const result = Requester.validateResultNumber(filter, [0, resultPath])
  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}

const capitalizeFirstLetter = (string: string) => {
  return string.charAt(0).toUpperCase() + string.slice(1)
}
