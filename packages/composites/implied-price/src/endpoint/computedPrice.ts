import type {
  AdapterRequest,
  AxiosRequestConfig,
  Config,
  ExecuteWithConfig,
  InputParameters,
} from '@chainlink/ea-bootstrap'
import {
  AdapterError,
  AdapterResponseInvalidError,
  Requester,
  util,
  Validator,
} from '@chainlink/ea-bootstrap'
import { AxiosResponse } from 'axios'
import Decimal from 'decimal.js'

export const supportedEndpoints = ['computedPrice']

export type SourceRequestOptions = { [source: string]: AxiosRequestConfig }

export type TInputParameters = {
  operand1Sources: string | string[]
  operand1MinAnswers?: number
  operand1Input: AdapterRequest
  operand2Sources: string | string[]
  operand2MinAnswers?: number
  operand2Input: AdapterRequest
  operation: string
}

const inputParameters: InputParameters<TInputParameters> = {
  operand1Sources: {
    required: true,
    description:
      'An array (string[]) or comma delimited list (string) of source adapters to query for the operand1 value',
  },
  operand1MinAnswers: {
    required: false,
    type: 'number',
    description: 'The minimum number of answers needed to return a value for the operand1',
    default: 1,
  },
  operand1Input: {
    required: true,
    type: 'object',
    description: 'The payload to send to the operand1 sources',
  },
  operand2Sources: {
    required: true,
    description:
      'An array (string[]) or comma delimited list (string) of source adapters to query for the operand2 value',
  },
  operand2MinAnswers: {
    required: false,
    type: 'number',
    description: 'The minimum number of answers needed to return a value for the operand2',
    default: 1,
  },
  operand2Input: {
    required: true,
    type: 'object',
    description: 'The payload to send to the operand2 sources',
  },
  operation: {
    required: true,
    type: 'string',
    description: 'The operation to perform on the operands',
    options: ['divide', 'multiply'],
  },
}

export const execute: ExecuteWithConfig<Config> = (input, _, config) => {
  const validator = new Validator(input, inputParameters)
  return executeComputedPrice(validator.validated.id, validator.validated.data, config)
}

export const executeComputedPrice = async (
  validatedId: string,
  validatedData: TInputParameters,
  config: Config,
) => {
  const jobRunID = validatedId
  const operand1Sources = parseSources(validatedData.operand1Sources)
  const operand2Sources = parseSources(validatedData.operand2Sources)
  const operand1MinAnswers = validatedData.operand1MinAnswers as number
  const operand2MinAnswers = validatedData.operand2MinAnswers as number
  const operand1Input = validatedData.operand1Input
  const operand2Input = validatedData.operand2Input
  const operation = validatedData.operation.toLowerCase()
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
    throw new AdapterResponseInvalidError({ message: 'Operand 1 result is zero' })
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
    throw new AdapterResponseInvalidError({ message: 'Operand 2 result is zero' })
  }

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
    result: result.toFixed(),
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
