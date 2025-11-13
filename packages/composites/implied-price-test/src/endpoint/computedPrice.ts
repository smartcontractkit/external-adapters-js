import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import {
  AdapterError,
  AdapterInputError,
} from '@chainlink/external-adapter-framework/validation/error'
import { config } from '../config'
import { computedPriceTransport } from '../transport/computePrice'
import { getOperandSourceUrls } from '../transport/utils'

export const inputParameters = new InputParameters(
  {
    operand1Sources: {
      required: true,
      type: 'string',
      array: true,
      aliases: ['dividendSources'],
      description: 'An array of source adapters to query for the operand1 value',
    },
    operand1Input: {
      required: true,
      type: 'string',
      aliases: ['dividendInput'],
      description: 'The JSON payload to send to the operand1 sources',
    },
    operand1MinAnswers: {
      required: false,
      type: 'number',
      aliases: ['dividendMinAnswers'],
      description: 'The minimum number of answers needed to return a value for the operand1',
      default: 1,
    },
    operand2Sources: {
      required: true,
      type: 'string',
      array: true,
      aliases: ['divisorSources'],
      description: 'An array of source adapters to query for the operand2 value',
    },
    operand2Input: {
      required: true,
      type: 'string',
      aliases: ['divisorInput'],
      description: 'The JSON payload to send to the operand2 sources',
    },
    operand2MinAnswers: {
      required: false,
      type: 'number',
      aliases: ['divisorMinAnswers'],
      description: 'The minimum number of answers needed to return a value for the operand2',
      default: 1,
    },
    operation: {
      default: 'divide',
      type: 'string',
      description: 'The operation to perform on the operands',
      options: ['divide', 'multiply'],
    },
  },
  [
    {
      operand1Sources: ['coingecko'],
      operand1MinAnswers: 1,
      operand1Input: '{"from":"LINK","to":"USD","overrides":{"coingecko":{"LINK":"chainlink"}}}',
      operand2Sources: ['coingecko'],
      operand2MinAnswers: 1,
      operand2Input: '{"from":"ETH","to":"USD","overrides":{"coingecko":{"ETH":"ethereum"}}}',
      operation: 'multiply',
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: {
    Result: string
    Data: {
      result: string
    }
  }
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'computedPrice',
  aliases: ['impliedPrice'],
  transport: computedPriceTransport,
  inputParameters,
  customInputValidation: (req): AdapterInputError | undefined => {
    const {
      operand1Sources,
      operand2Sources,
      operand1MinAnswers,
      operand2MinAnswers,
      operand1Input,
      operand2Input,
    } = req.requestContext.data
    validateSources(operand1Sources, operand1MinAnswers)
    validateSources(operand2Sources, operand2MinAnswers)
    validateInputPayload(operand1Input, 'operand1Input')
    validateInputPayload(operand2Input, 'operand2Input')
    return
  },
})

const validateSources = (sources: string[], minAnswers: number) => {
  if (sources.length < minAnswers) {
    throw new AdapterInputError({
      statusCode: 400,
      message: `Not enough sources: got ${sources.length} sources, requiring at least ${minAnswers} answers`,
    })
  }

  const urls = getOperandSourceUrls(sources)
  const missingUrlCount = minAnswers - urls.length
  if (missingUrlCount > 0) {
    const missingEnvVars = sources
      .map((source) => `${source.toUpperCase()}_ADAPTER_URL`)
      .filter((envVar) => !process.env[envVar])
    throw new AdapterError({
      statusCode: 500,
      message: `Not enough sources configured. Make sure ${missingUrlCount} of the following are set in the environment: ${missingEnvVars.join(
        ', ',
      )}`,
    })
  }
  return
}

const validateInputPayload = (input: string, inputName: string) => {
  try {
    return JSON.parse(input)
  } catch (e) {
    throw new AdapterInputError({
      statusCode: 400,
      message: `Input payload for "${inputName}" is not valid JSON.`,
    })
  }
}
