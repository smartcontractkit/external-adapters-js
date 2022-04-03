import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'
import { Requester, util, Validator } from '@chainlink/ea-bootstrap'

export const supportedEndpoints = ['price']

export const commonKeys: Record<string, string> = {
  bz: 'BRENT_CRUDE_USD',
  brent: 'BRENT_CRUDE_USD',
  wti: 'WTI_USD',
}

export const inputParameters: InputParameters = {
  base: {
    aliases: ['type', 'asset', 'from', 'market'],
    description: 'The type of oil to get the price from',
    options: ['bz', 'brent', 'wti'],
    required: true,
  },
  url: {
    description: 'The endpoint to use',
    default: 'prices/latest',
    required: false,
  },
}

export const customError = (data: Record<string, unknown>) => {
  return data.data === null
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  const url = validator.validated.data.url
  const base = validator.validated.data.base.toLowerCase()
  // eslint-disable-next-line camelcase
  const by_code = commonKeys[base] || base
  const params = {
    by_code,
  }
  const headers = {
    Authorization: `Token ${config.apiKey}`,
  }

  const reqConfig = {
    ...config.api,
    params,
    url: util.buildUrlPath(':url', { url }, '/'),
    headers,
  }

  const response = await Requester.request(reqConfig, customError)
  response.data.result = Requester.validateResultNumber(response.data, ['data', 'price'])
  return Requester.success(jobRunID, response)
}
