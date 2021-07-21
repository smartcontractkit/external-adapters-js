import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'

export const supportedEndpoints = ['dataquery']

const customError = (data: any) => data.status !== '200'

export const inputParameters: InputParameters = {
  base: ['base', 'from', 'coin'],
  quote: ['quote', 'to', 'market'],
  resultPath: false,
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const base = validator.validated.data.base.toUpperCase()
  const quote = validator.validated.data.quote.toUpperCase()
  const resultPath = validator.validated.data.resultPath || 'result'
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
  response.data.result = Requester.validateResultNumber(response.data, [resultPath])

  return Requester.success(jobRunID, response, config.verbose)
}
