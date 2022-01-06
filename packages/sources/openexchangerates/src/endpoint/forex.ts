import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, InputParameters } from '@chainlink/types'
import { NAME as AdapterName } from '../config'

export const supportedEndpoints = ['forex', 'price']

export const inputParameters: InputParameters = {
  base: {
    aliases: ['from', 'coin'],
    required: true,
    description: 'The symbol of the currency to query',
  },
  quote: {
    aliases: ['to', 'market'],
    required: true,
    description: 'The symbol of the currency to convert to',
  },
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const url = 'latest.json'
  const base = validator.overrideSymbol(AdapterName)
  const to = validator.validated.data.quote

  const params = {
    base,
    app_id: config.apiKey,
  }

  const options = {
    ...config.api,
    params,
    url,
  }

  const response = await Requester.request(options)
  response.data.result = Requester.validateResultNumber(response.data, ['rates', to])

  return Requester.success(jobRunID, response, config.verbose)
}
