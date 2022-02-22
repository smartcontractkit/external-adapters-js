import { AdapterError, Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, InputParameters } from '@chainlink/types'
import { Config, NAME } from '../config'

export const supportedEndpoints = ['values', 'crypto', 'price']

const idFromBaseQuoteSymbol: { [baseQuote: string]: string } = {
  'BTC/USD': 'BRTI',
}

export const inputParameters: InputParameters = {
  index: {
    description: 'The ID of the index',
    type: 'string',
    required: false,
  },
  base: {
    aliases: ['from', 'coin'],
    description: 'The base asset to convert from (if index is not present)',
    type: 'string',
    required: false,
  },
  quote: {
    aliases: ['to', 'market', 'term'],
    description: 'The quote asset to convert to (if index is not present)',
    type: 'string',
    required: false,
  },
}

const getIdFromBaseQuoteSymbols = (config: Config, base: string, quote: string) => {
  const baseQuote = `${base}/${quote}`

  let id = idFromBaseQuoteSymbol[baseQuote] // Check hardcoded conversions first
  if (!id) {
    // If not hardcoded, use template
    if (config.useSecondary) {
      id = `U_${base}${quote}_RTI`
    } else {
      id = `${base}${quote}_RTI`
    }
  }

  return id
}

export const getIdFromInputs = (
  config: Config,
  validator: Validator,
  shouldThrowError = true,
): string | undefined => {
  if (
    !(
      validator.validated.data.index ||
      (validator.validated.data.base && validator.validated.data.quote)
    )
  ) {
    const missingInput = !validator.validated.data.index ? 'index' : 'base /or quote'
    if (shouldThrowError) {
      throw new AdapterError({
        jobRunID: validator.validated.id,
        statusCode: 400,
        message: `Error: missing ${missingInput} input parameters`,
      })
    } else {
      return
    }
  }

  return validator.validated.data.index
    ? (validator.overrideSymbol(NAME, validator.validated.data.index) as string)
    : getIdFromBaseQuoteSymbols(
        config,
        validator.validated.data.base,
        validator.validated.data.quote,
      )
}

interface PayloadValue {
  value: string
  time: number
}

export interface ResponseSchema {
  payload: PayloadValue[]
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id

  const id = getIdFromInputs(config, validator)

  const url = `/v1/values`

  const params = {
    id,
  }

  const reqConfig = { ...config.api, params, url }

  const response = await Requester.request<ResponseSchema>(reqConfig)

  const values = response.data.payload.sort((a, b) => {
    if (a.time < b.time) return 1
    if (a.time > b.time) return -1
    return 0
  })

  const result = Requester.validateResultNumber(values, [0, 'value'])
  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
