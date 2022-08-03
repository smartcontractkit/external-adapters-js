import { AdapterResponseEmptyError, Requester, util, Validator } from '@chainlink/ea-bootstrap'
import {
  AdapterRequest,
  ExecuteWithConfig,
  InputParameters,
  AxiosResponse,
} from '@chainlink/ea-bootstrap'
import { Config, NAME } from '../config'
import overrides from '../config/symbols.json'

export const supportedEndpoints = ['price']

export type TInputParameters = { base: string; quote: string }
export const inputParameters: InputParameters<TInputParameters> = {
  base: {
    aliases: ['from', 'asset'],
    required: true,
    description: 'The symbol of the asset to query',
    type: 'string',
  },
  quote: {
    aliases: ['to', 'term'],
    description: 'The quote symbol of the asset to query',
    type: 'string',
    default: 'USD',
  },
}

export const execute: ExecuteWithConfig<Config> = async (
  input: AdapterRequest,
  _,
  config: Config,
) => {
  const validator = new Validator(input, inputParameters, {}, { overrides })

  const jobRunID = validator.validated.id
  const symbol = validator.overrideSymbol(NAME, validator.validated.data.base).toUpperCase()

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

  const response: AxiosResponse = await Requester.request(request)
  if (!response.data || response.data.length < 1) {
    throw new AdapterResponseEmptyError({ jobRunID, message: 'no result for query' })
  }
  // Replace array by the first object in array
  // to avoid unexpected behavior when returning arrays.
  response.data = response.data[0]

  response.data.result = Requester.validateResultNumber(response.data, ['Last'])
  return Requester.success(jobRunID, response)
}
