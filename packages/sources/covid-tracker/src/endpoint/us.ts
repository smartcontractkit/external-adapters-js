import { Requester, Validator, AdapterError, util } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'

export const supportedEndpoints = ['us']

export const endpointResultPaths = {
  us: 'death',
}

export const inputParameters: InputParameters = {
  date: {
    description: 'The date to query formatted by `[YEAR][MONTH][DAY]` (e.g. `20201012`)',
  },
}

const validDate = (date: string) => {
  if (date) {
    if (isNaN(Number(date))) return false
    if (date.length != 8) return false
  }
  return true
}

const findDay = (payload: ResponseSchema[], date: string) => {
  if (!date) return payload[0]
  // All historical dates are given, find the the correct one
  for (const index in payload) {
    if (payload[index].date === Number(date)) {
      return payload[index]
    }
    // Response body is sorted by descending data. If we see an earlier date we know our result doesn't exist.
    if (payload[index].date < Number(date)) {
      return null
    }
  }
  return null
}

export interface ResponseSchema {
  date: number
  states: number
  positive: number
  negative: number
  pending: number
  hospitalizedCurrently: number
  hospitalizedCumulative: number
  inIcuCurrently: number
  inIcuCumulative: number
  onVentilatorCurrently: number
  onVentilatorCumulative: number
  dateChecked: string
  death: number
  hospitalized: number
  totalTestResults: number
  lastModified: string
  recovered: number
  total: number
  posNeg: number
  deathIncrease: number
  hospitalizedIncrease: number
  negativeIncrease: number
  positiveIncrease: number
  totalTestResultsIncrease: number
  hash: string
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  const date = validator.validated.data.date
  const resultPath = validator.validated.data.resultPath
  if (!validDate(date))
    throw new AdapterError({
      jobRunID,
      message: 'Invalid date format',
      statusCode: 400,
    })
  const suffix = date ? 'daily' : 'current'
  const url = util.buildUrlPath('us/:suffix.json', { suffix })

  const options = {
    ...config.api,
    url,
  }

  const response = await Requester.request<ResponseSchema[]>(options)
  const day = findDay(response.data, date)
  if (!day)
    throw new AdapterError({
      jobRunID,
      message: 'Date not found in response data',
      statusCode: 400,
    })
  const result = Requester.validateResultNumber(day, [resultPath])
  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
