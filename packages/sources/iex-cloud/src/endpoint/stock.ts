import { Requester, util, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'
import { NAME as AdapterName } from '../config'
import { ResponseSchema } from './eod'

export const supportedEndpoints = ['stock']

export const inputParameters: InputParameters = {
  base: {
    aliases: ['from', 'coin', 'asset', 'symbol'],
    description: 'The symbol to query',
    required: true,
    type: 'string',
  },
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  const base = validator.overrideSymbol(AdapterName) as string
  const url = util.buildUrlPath('stock/:base/quote', { base: base.toUpperCase() })

  const params = {
    token: config.apiKey,
  }

  const reqConfig = {
    ...config.api,
    params,
    url,
  }

  const response = await Requester.request<ResponseSchema>(reqConfig)
  const result = Requester.validateResultNumber(response.data, ['latestPrice'])

  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
