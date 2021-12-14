import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'
import { NAME as AdapterName } from '../config'

export const supportedEndpoints = ['price', 'forex']

export const inputParameters: InputParameters = {
  base: {
    aliases: ['from'],
    description: 'The symbol of the currency to query',
    required: true,
  },
  quote: {
    aliases: ['to'],
    description: ' The symbol of the currency to convert to',
    required: true,
  },
  quantity: {
    description: 'An additional amount of the original currency',
  },
  overrides: {
    description: `If base provided is found in overrides, that will be used [Format](../../core/bootstrap/src/lib/external-adapter/overrides/presetSymbols.json)`,
  },
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const url = `/convert`
  const from = (validator.overrideSymbol(AdapterName) as string).toUpperCase()
  const to = validator.validated.data.quote.toUpperCase()
  const quantity = validator.validated.data.quantity || 1

  const params = {
    ...config.api.params,
    from,
    to,
    quantity,
  }

  const options = {
    ...config.api,
    url,
    params,
  }

  const response = await Requester.request(options)
  response.data.result = Requester.validateResultNumber(response.data, ['value'])

  return Requester.success(jobRunID, response, config.verbose)
}
