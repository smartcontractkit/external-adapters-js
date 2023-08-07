import type { Config, ExecuteWithConfig, InputParameters } from '@chainlink/ea-bootstrap'
import { Requester, util, Validator } from '@chainlink/ea-bootstrap'
import { NAME } from '../config'
import overrides from '../config/symbols.json'
import { ResponseSchema } from './forex'

export const supportedEndpoints = ['crypto']

export type TInputParameters = { base: string; quote: string }
export const inputParameters: InputParameters<TInputParameters> = {
  base: {
    required: true,
    aliases: ['from', 'symbol'],
    description: 'The symbol of the currency to query',
    type: 'string',
  },
  quote: {
    required: true,
    aliases: ['to', 'market'],
    description: 'The symbol of the currency to convert to',
    type: 'string',
  },
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters, {}, { overrides })
  const jobRunID = validator.validated.id
  const from = validator.overrideSymbol(NAME, validator.validated.data.base).toUpperCase()
  const to = validator.validated.data.quote.toUpperCase()

  const url = util.buildUrlPath('/last/crypto/:from:to', { from, to })
  const params = {
    apikey: config.apiKey,
  }

  const options = {
    ...config.api,
    url,
    params,
  }

  const response = await Requester.request<ResponseSchema>(options)
  const result = Requester.validateResultNumber(response.data, ['price'])
  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
