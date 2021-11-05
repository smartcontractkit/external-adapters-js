import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'

export const supportedEndpoints = ['historical']

export const inputParameters: InputParameters = {
  symbol: true,
  start: false,
  end: false,
  count: false,
  interval: false,
  convert: false,
  cid: false,
  aux: false,
  skipInvalid: false,
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id

  const symbol = validator.validated.data.symbol?.toUpperCase() || 'BTC'
  const time_start = validator.validated.data.start
  const time_end = validator.validated.data.end
  const count = validator.validated.data.count || 10
  const interval = validator.validated.data.interval || '5m'
  const convert = validator.validated.data.convert?.toUpperCase() || 'USD'
  const convert_id = validator.validated.data.cid

  const aux = validator.validated.data.aux
  const skip_invalid = validator.validated.data.skipInvalid || true
  const url = 'cryptocurrency/quotes/historical'

  const params = {
    symbol,
    time_start,
    time_end,
    count,
    interval,
    convert,
    convert_id,
    aux,
    skip_invalid,
  }

  const options = {
    ...config.api,
    url,
    params,
  }

  const response = await Requester.request(options)
  return Requester.success(
    jobRunID,
    Requester.withResult(response, response.data.data),
    config.verbose,
  )
}
