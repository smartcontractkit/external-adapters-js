import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'

export const supportedEndpoints = ['historical']

export const inputParameters: InputParameters = {
  base: ['base', 'from', 'coin', 'sym', 'symbol'],
  convert: ['quote', 'to', 'market', 'convert'],
  start: false,
  end: false,
  count: false,
  interval: false,
  cid: false,
  aux: false,
  skipInvalid: false,
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const symbol = validator.validated.data.base?.toUpperCase()
  const convert = validator.validated.data.convert?.toUpperCase()
  const time_start = validator.validated.data.start
  const time_end = validator.validated.data.end
  const count = validator.validated.data.count
  const interval = validator.validated.data.interval
  const convert_id = validator.validated.data.cid
  const aux = validator.validated.data.aux
  const skip_invalid = validator.validated.data.skipInvalid
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
