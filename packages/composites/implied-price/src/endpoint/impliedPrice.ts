import { Validator } from '@chainlink/ea-bootstrap'
import type {
  AdapterRequest,
  ExecuteWithConfig,
  Config,
  InputParameters,
  AxiosRequestConfig,
} from '@chainlink/ea-bootstrap'
import { executeComputedPrice } from './computedPrice'

export const supportedEndpoints = ['impliedPrice']

export type SourceRequestOptions = { [source: string]: AxiosRequestConfig }

export type TInputParameters = {
  dividendSources: string | string[]
  dividendMinAnswers?: number
  dividendInput: AdapterRequest
  divisorSources: string | string[]
  divisorMinAnswers?: number
  divisorInput: AdapterRequest
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
    required: true,
    type: 'object',
    description: 'The payload to send to the dividend sources',
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
    required: true,
    type: 'object',
    description: 'The payload to send to the divisor sources',
  },
}

export const execute: ExecuteWithConfig<Config> = async (input, _, config) => {
  const validator = new Validator(input, inputParameters)

  const {
    dividendSources,
    dividendMinAnswers,
    dividendInput,
    divisorSources,
    divisorMinAnswers,
    divisorInput,
  } = validator.validated.data

  const validatedData = {
    operand1Sources: dividendSources,
    operand1MinAnswers: dividendMinAnswers,
    operand1Input: dividendInput,
    operand2Sources: divisorSources,
    operand2MinAnswers: divisorMinAnswers,
    operand2Input: divisorInput,
    operation: 'divide',
  }

  return executeComputedPrice(validator.validated.id, validatedData, config)
}
