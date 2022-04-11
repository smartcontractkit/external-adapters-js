import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'

export const supportedEndpoints = ['vwap']

const customError = (data: ResponseSchema) => !data.vwap

export const description =
  'Endpoint to calculate the volume weighted average price (VWAP) for a price pair.'

export const inputParameters: InputParameters = {
  base: {
    aliases: ['from', 'coin'],
    description: 'The symbol of the currency to query',
    required: true,
    type: 'string',
  },
  quote: {
    aliases: ['to', 'market'],
    description: 'The symbol of the currency to convert to',
    required: true,
    type: 'string',
  },
}

export interface ResponseSchema {
  start: number
  end: number
  vwap: number
  volume: number
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  const base = validator.validated.data.base.toUpperCase()
  const quote = validator.validated.data.quote.toUpperCase()
  const url = `/market/${base}_${quote}/daily-volume/`

  const params = {
    roundDay: true,
  }

  const options = {
    ...config.api,
    url,
    params,
  }

  const response = await Requester.request<ResponseSchema>(options, customError)
  const result = Requester.validateResultNumber(response.data, ['vwap'])

  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
