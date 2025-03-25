import {
  AdapterError,
  AdapterInputError,
  AdapterResponseInvalidError,
  Requester,
  util,
  Validator,
} from '@chainlink/ea-bootstrap'
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
  operand1Sources: string | string[]
  operand1MinAnswers?: number
  operand1Input?: AdapterRequest
  operand2Sources: string | string[]
  operand2MinAnswers?: number
  operand2Input?: AdapterRequest
  operation?: string
  dividendSources: string | string[]
  dividendMinAnswers?: number
  dividendInput?: AdapterRequest
  divisorSources: string | string[]
  divisorMinAnswers?: number
  divisorInput?: AdapterRequest
}

const inputParameters: InputParameters<TInputParameters> = {
  operand1Sources: {
    required: false,
    description:
      'An array (string[]) or comma delimited list (string) of source adapters to query for the operand1 value',
  },
  operand1MinAnswers: {
    required: false,
    type: 'number',
    description: 'The minimum number of answers needed to return a value for operand1',
  },
  operand1Input: {
    required: false,
    type: 'object',
    description: 'The payload to send to the operand1 sources',
  },
  operand2Sources: {
    required: false,
    description:
      'An array (string[]) or comma delimited list (string) of source adapters to query for the operand2 value',
  },
  operand2MinAnswers: {
    required: false,
    type: 'number',
    description: 'The minimum number of answers needed to return a value for operand2',
  },
  operand2Input: {
    required: false,
    type: 'object',
    description: 'The payload to send to the operand2 sources',
  },
  operation: {
    required: false,
    type: 'string',
    description: 'The operation to perform on the operands',
    options: ['divide', 'multiply'],
  },
  dividendSources: {
    required: false,
    description:
      'Legacy: Use `operand1Sources instead. An array (string[]) or comma delimited list (string) of source adapters to query for the dividend value',
  },
  dividendMinAnswers: {
    required: false,
    type: 'number',
    description:
      'Legacy: Use `operand1MinAnswers instead. The minimum number of answers needed to return a value for the dividend',
  },
  dividendInput: {
    required: false,
    type: 'object',
    description: 'Legacy: Use `operand1Input` instead. The payload to send to the dividend sources',
  },
  divisorSources: {
    required: false,
    description:
      'Legacy: Use `operand2Sources` instead. An array (string[]) or comma delimited list (string) of source adapters to query for the divisor value',
  },
  divisorMinAnswers: {
    required: false,
    type: 'number',
    description:
      'Legacy: Use `operand2MinAnswers` instead. The minimum number of answers needed to return a value for the divisor',
  },
  divisorInput: {
    required: false,
    type: 'object',
    description: 'Legacy: Use `operand2Input` instead. The payload to send to the divisor sources',
  },
}

const hasSomeLegacyParameters = (data: TInputParameters): boolean => {
  return !!(
    data.dividendSources ||
    data.dividendMinAnswers ||
    data.dividendInput ||
    data.divisorSources ||
    data.divisorMinAnswers ||
    data.divisorInput
  )
}

const hasAllRequiredLegacyParameters = (data: TInputParameters): boolean => {
  return !!(data.dividendSources && data.dividendInput && data.divisorSources && data.divisorInput)
}

const hasSomeNewParameters = (data: TInputParameters): boolean => {
  return !!(
    data.operand1Sources ||
    data.operand1MinAnswers ||
    data.operand1Input ||
    data.operand2Sources ||
    data.operand2MinAnswers ||
    data.operand2Input ||
    data.operation
  )
}

const hasAllRequiredNewParameters = (data: TInputParameters): boolean => {
  return !!(
    data.operand1Sources &&
    data.operand1Input &&
    data.operand2Sources &&
    data.operand2Input &&
    data.operation
  )
}

// Checks that either only legacy or only new parameters are used and that of
// the used parameter set all required parameters are present.
const customInputValidation = (validator: Validator<TInputParameters>) => {
  const { data } = validator.validated
  const usesLegacyParams = hasSomeLegacyParameters(data)
  const usesNewParams = hasSomeNewParameters(data)

  let message: string | undefined = undefined
  if (usesLegacyParams && usesNewParams) {
    message = 'Must use only dividend/divisor parameters or only operand1/operand2 parameters'
  } else if (!usesLegacyParams && !usesNewParams) {
    message = 'Must specify required dividend/divisor or required operand1/operand2 parameters'
  } else {
    if (usesLegacyParams) {
      if (!hasAllRequiredLegacyParameters(data)) {
        message =
          'Must specify all required dividend/divisor parameters: dividendSources, dividendInput, divisorSources, divisorInput'
      }
    } else if (!hasAllRequiredNewParameters(data)) {
      message =
        'Must specify all required operand1/operand2 parameters: operand1Sources, operand1Input, operand2Sources, operand2Input, operation'
    }
  }

  if (message) {
    throw new AdapterInputError({
      jobRunID: validator.validated.id,
      statusCode: 400,
      message,
    })
  }
}

const transformInput = (data: TInputParameters) => {
  const usesLegacyParams = hasSomeLegacyParameters(data)
  if (!usesLegacyParams) {
    return
  }
  data.operation = 'divide'
  data.operand1Sources = data.dividendSources
  data.operand1MinAnswers = data.dividendMinAnswers
  data.operand1Input = data.dividendInput
  data.operand2Sources = data.divisorSources
  data.operand2MinAnswers = data.divisorMinAnswers
  data.operand2Input = data.divisorInput
}

export const execute: ExecuteWithConfig<Config> = async (input, _, config) => {
  const validator = new Validator(input, inputParameters)

  customInputValidation(validator)
  transformInput(validator.validated.data)

  const jobRunID = validator.validated.id
  const operand1Sources = parseSources(validator.validated.data.operand1Sources)
  const operand2Sources = parseSources(validator.validated.data.operand2Sources)
  const operand1MinAnswers = validator.validated.data.operand1MinAnswers as number
  const operand2MinAnswers = validator.validated.data.operand2MinAnswers as number
  const operand1Input = validator.validated.data.operand1Input as AdapterRequest
  const operand2Input = validator.validated.data.operand2Input as AdapterRequest
  // TODO: non-nullable default types

  const operand1Urls = operand1Sources.map((source) => util.getRequiredURL(source.toUpperCase()))
  const operand1Result = await getExecuteMedian(
    jobRunID,
    operand1Urls,
    operand1Input,
    operand1MinAnswers,
    config,
  )
  if (operand1Result.isZero()) {
    throw new AdapterResponseInvalidError({ message: 'Dividend result is zero' })
  }

  const operand2Urls = operand2Sources.map((source) => util.getRequiredURL(source.toUpperCase()))
  const operand2Result = await getExecuteMedian(
    jobRunID,
    operand2Urls,
    operand2Input,
    operand2MinAnswers,
    config,
  )
  if (operand2Result.isZero()) {
    throw new AdapterResponseInvalidError({ message: 'Divisor result is zero' })
  }

  const operation = validator.validated.data.operation?.toLowerCase()
  let result: Decimal
  if (operation === 'divide') {
    result = operand1Result.div(operand2Result)
  } else if (operation === 'multiply') {
    result = operand1Result.mul(operand2Result)
  } else {
    throw new AdapterError({
      message: `Unsupported operation: ${operation}. This should not be possible because of input validation.`,
    })
  }

  const data = {
    operand1Result: operand1Result.toString(),
    operand2Result: operand2Result.toString(),
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
