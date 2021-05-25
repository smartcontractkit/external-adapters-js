import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig } from '@chainlink/types'
import { NAME as AdapterName } from '../config'

export const NAME = 'ticker'

const customError = (data: any) => data.Response === 'Error'

export const customParams = {
  base: ['base', 'from', 'coin'],
  quote: ['quote', 'to', 'market'],
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  let base = validator.overrideSymbol(AdapterName)
  if (Array.isArray(base)) base = base[0]
  const quote = validator.validated.data.quote
  const symbol = `${base.toUpperCase()}${quote.toUpperCase()}`
  const url = `/api/v3/ticker/price`

  const params = {
    symbol,
  }

  const options = { ...config.api, params, url }

  const response = await Requester.request(options, customError)
  response.data.result = Requester.validateResultNumber(response.data, ['price'])

  return Requester.success(jobRunID, response, config.verbose)
}
