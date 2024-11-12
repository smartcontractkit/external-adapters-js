import { AdapterResponseInvalidError, Requester, util, Validator } from '@chainlink/ea-bootstrap'
import type {
  AdapterRequest,
  ExecuteWithConfig,
  Config,
  InputParameters,
  AxiosRequestConfig,
} from '@chainlink/ea-bootstrap'
import { AxiosResponse } from 'axios'
import Decimal from 'decimal.js'

export const supportedEndpoints = ['impliedPrice']

export type SourceRequestOptions = { [source: string]: AxiosRequestConfig }

export type TInputParameters = {
  dividendSources: string | string[]
  dividendMinAnswers?: number
  dividendInput?: AdapterRequest
  divisorSources: string | string[]
  divisorMinAnswers?: number
  divisorInput?: AdapterRequest
}

const inputParameters: InputParameters<TInputParameters> = {
  dividendSources: {
    required: true,
    description:
      'An array (string[]) or comma delimited list (string) of source adapters to query for the dividend value',
  },
  dividendMinAnswers: {
    required: false,
    type: 'number',
    description: 'The minimum number of answers needed to return a value for the dividend',
    default: 1,
  },
  dividendInput: {
    required: false,
    type: 'object',
    description: 'The payload to send to the dividend sources',
    default: {} as AdapterRequest,
  },
  divisorSources: {
    required: true,
    description:
      'An array (string[]) or comma delimited list (string) of source adapters to query for the divisor value',
  },
  divisorMinAnswers: {
    required: false,
    type: 'number',
    description: 'The minimum number of answers needed to return a value for the divisor',
    default: 1,
  },
  divisorInput: {
    required: false,
    type: 'object',
    description: 'The payload to send to the divisor sources',
    default: {} as AdapterRequest,
  },
}

export const execute: ExecuteWithConfig<Config> = async (input, _, config) => {
  const validator = new Validator(input, inputParameters)

  const jobRunID = validator.validated.id
  const dividendSources = parseSources(validator.validated.data.dividendSources)
  const divisorSources = parseSources(validator.validated.data.divisorSources)
  const dividendMinAnswers = validator.validated.data.dividendMinAnswers as number
  const divisorMinAnswers = validator.validated.data.divisorMinAnswers as number
  const dividendInput = validator.validated.data.dividendInput as AdapterRequest
  const divisorInput = validator.validated.data.divisorInput as AdapterRequest
  // TODO: non-nullable default types

  const dividendUrls = dividendSources.map((source) => util.getRequiredURL(source.toUpperCase()))
  const dividendResult = await getExecuteMedian(
    jobRunID,
    dividendUrls,
    dividendInput,
    dividendMinAnswers,
    config,
  )
  if (dividendResult.isZero()) {
    throw new AdapterResponseInvalidError({ message: 'Dividend result is zero' })
  }

  const divisorUrls = divisorSources.map((source) => util.getRequiredURL(source.toUpperCase()))
  const divisorResult = await getExecuteMedian(
    jobRunID,
    divisorUrls,
    divisorInput,
    divisorMinAnswers,
    config,
  )
  if (divisorResult.isZero()) {
    throw new AdapterResponseInvalidError({ message: 'Divisor result is zero' })
  }

  const result = dividendResult.div(divisorResult)

  const data = {
    dividendResult: dividendResult.toString(),
    divisorResult: divisorResult.toString(),
    result: result.toString(),
  }

  const response = { data, status: 200 }
  return Requester.success(jobRunID, response)
}

export const parseSources = (sources: string | string[]): string[] => {
  if (Array.isArray(sources)) {
    return sources
  }
  return sources.split(',')
}

const getExecuteMedian = async (
  jobRunID: string,
  urls: string[],
  request: AdapterRequest,
  minAnswers: number,
  config: Config,
): Promise<Decimal> => {
  const responses = await Promise.allSettled(
    urls.map(
      async (url) =>
        await Requester.request({
          ...config.api,
          method: 'post',
          url,
          data: {
            id: jobRunID,
            data: request,
          },
        }),
    ),
  )
  const values = responses
    .filter((result) => result.status === 'fulfilled' && 'value' in result)
    .map(
      (result) =>
        (result as PromiseFulfilledResult<AxiosResponse<Record<string, number>>>).value.data.result,
    )
  if (values.length < minAnswers)
    throw new AdapterResponseInvalidError({
      jobRunID,
      message: `Not returning median: got ${values.length} answers, requiring min. ${minAnswers} answers`,
    })
  return median(values)
}

export const median = (values: number[]): Decimal => {
  if (values.length === 0) return new Decimal(0)
  values.sort((a, b) => a - b)
  const half = Math.floor(values.length / 2)
  if (values.length % 2) return new Decimal(values[half])
  return new Decimal(values[half - 1] + values[half]).div(2)
}
