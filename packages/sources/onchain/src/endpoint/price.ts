import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'
import { Requester, Validator } from '@chainlink/ea-bootstrap'

const customError = (data: any) => data.Response === 'Error'

export const supportedEndpoints = ['price']

export const inputParameters: InputParameters = {
  market: {
    aliases: ['market', 'from', 'future'],
    required: true,
  },
}

export const commonKeys: Record<string, string> = {
  brent: 'BRN',
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  let market = validator.validated.data.market.toLowerCase()
  if (market in commonKeys) market = commonKeys[market]

  const url = `Quote/oil/${market}`

  const headers = {
    'x-api-key': config.apiKey,
  }

  const options = {
    ...config.api,
    url,
    headers,
  }

  const response = await Requester.request(options, customError)
  response.data.result = Requester.validateResultNumber(response.data, ['price'])
  return Requester.success(jobRunID, response)
}
