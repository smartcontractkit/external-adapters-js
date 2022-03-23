import { Requester, util, Validator } from '@chainlink/ea-bootstrap'
import { AdapterRequest, ExecuteWithConfig, InputParameters } from '@chainlink/types'
import { Config, NAME } from '../config'
import overrides from '../config/symbols.json'

export const supportedEndpoints = ['price']

export const inputParameters: InputParameters = {
  base: {
    aliases: ['from', 'asset'],
    required: true,
    description: 'The symbol of the asset to query',
    type: 'string',
  },
}

export const execute: ExecuteWithConfig<Config> = async (
  input: AdapterRequest,
  _,
  config: Config,
) => {
  const validator = new Validator(input, inputParameters, {}, { overrides })

  const jobRunID = validator.validated.id
  const symbol = (validator.overrideSymbol(NAME) as string).toUpperCase()

  // Fall back to getting the data from HTTP endpoint
  const url = util.buildUrlPath('/symbol/:symbol', { symbol }, ':')

  const params = {
    c: `${config.client.key}:${config.client.secret}`,
  }

  const request = {
    ...config.api,
    url,
    params,
  }

  const response = await Requester.request(request)
  if (!response.data || response.data.length < 1) {
    throw new Error('no result for query')
  }
  // Replace array by the first object in array
  // to avoid unexpected behavior when returning arrays.
  response.data = response.data[0]

  response.data.result = Requester.validateResultNumber(response.data, ['Last'])
  return Requester.success(jobRunID, response)
}
