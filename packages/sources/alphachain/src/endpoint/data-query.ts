import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config } from '@chainlink/types'

export const NAME = 'dataquery'

const customError = (data: any) => data.status !== '200'

const customParams = {
  base: ['base', 'from', 'coin'],
  quote: ['quote', 'to', 'market'],
  field: false,
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const base = validator.validated.data.base.toUpperCase()
  const quote = validator.validated.data.quote.toUpperCase()
  const field = validator.validated.data.field || 'result'
  const url = '/data-query'
  const host = 'alpha-chain2.p.rapidapi.com'
  const headers = {
    'content-type': 'application/octet-stream',
    'x-rapidapi-host': host,
    'x-rapidapi-key': config.apiKey,
    useQueryString: true,
  }

  const params = {
    from_symbol: base,
    to_symbol: quote,
    chainlink_node: true,
  }

  const options = {
    ...config.api,
    url,
    params,
    headers,
  }

  const response = await Requester.request(options, customError)
  response.data.result = Requester.validateResultNumber(response.data, [field])

  return Requester.success(jobRunID, response, config.verbose)
}
