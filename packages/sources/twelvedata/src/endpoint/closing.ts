import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config } from '@chainlink/types'
import { NAME as AdapterName } from '../config'

export const NAME = 'closing'
export const ALT_NAME = 'eod'

const customError = (data: any) => data.Response === 'Error'

const customParams = {
  base: ['base', 'from', 'coin', 'market', 'symbol'],
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const symbol = (validator.overrideSymbol(AdapterName) as string).toUpperCase()

  const url = `eod`
  const params = {
    symbol,
    apikey: config.apiKey,
  }

  const options = {
    ...config.api,
    params,
    url,
  }

  const response = await Requester.request(options, customError)
  response.data.result = Requester.validateResultNumber(response.data, ['close'])

  return Requester.success(jobRunID, response, config.verbose)
}
