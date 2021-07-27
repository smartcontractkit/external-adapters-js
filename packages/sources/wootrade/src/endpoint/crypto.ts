import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, InputParameters } from '@chainlink/types'
import { NAME as AdapterName } from '../config'

export const supportedEndpoints = ['crypto', 'ticker']

const customError = (data: any) => data.Response === 'Error'

export const inputParameters: InputParameters = {
  base: ['base', 'from', 'coin'],
  quote: ['quote', 'to', 'market'],
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  let base = validator.overrideSymbol(AdapterName)
  if (Array.isArray(base)) base = base[0]
  const quote = validator.validated.data.quote
  const symbol = `SPOT_${base.toUpperCase()}_${quote.toUpperCase()}`
  const limit = '1'
  const url = `/v1/public/market_trades/`

  const params = {
    symbol,
    limit
  }

  const options = { ...config.api, params, url }
  const response = await Requester.request(options, customError)
  const price = response.data.rows[0].executed_price
  response.data.result = Requester.validateResultNumber({price}, ['price'])

  return Requester.success(jobRunID, response, config.verbose)
}
