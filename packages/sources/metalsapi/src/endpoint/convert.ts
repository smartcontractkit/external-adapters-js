import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'
import { NAME as AdapterName } from '../config'

export const supportedEndpoints = ['convert', 'price']

const customError = (data: any) => data.Response === 'Error'

export const inputParameters: InputParameters = {
  base: {
    required: true,
    aliases: ['from', 'coin'],
    description: 'The symbol of the currency to query',
  },
  quote: {
    required: true,
    aliases: ['to', 'market'],
    description: 'The symbol of the currency to convert to',
  },
  amount: {
    required: false,
    type: 'number',
    description: 'The amount fo the `base` currency',
    default: 1,
  },
  overrides: {
    required: false,
    type: 'object',
    description:
      'If base provided is found in overrides, that will be used. Follows this [format](../../core/bootstrap/src/lib/external-adapter/overrides/presetSymbols.json)',
  },
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const from = (validator.overrideSymbol(AdapterName) as string).toUpperCase()
  const to = validator.validated.data.quote.toUpperCase()
  const amount = validator.validated.data.amount
  const url = `convert`

  const params = {
    access_key: config.apiKey,
    from,
    to,
    amount,
  }

  const reqConfig = { ...config.api, params, url }

  const response = await Requester.request(reqConfig, customError)
  return Requester.success(jobRunID, response, config.verbose)
}
