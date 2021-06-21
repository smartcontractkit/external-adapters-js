import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config } from '@chainlink/types'

export const supportedEndpoints = ['global','globalmarketcap','dominance']

export const endpointPaths = {
  globalmarketcap: 'total_mcap'
}

const customParams = {
  base: false,
  field: false,
  path: false,
  endpoint: false
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error
  const endpoint = validator.validated.data.endpoint || config.DEFAULT_ENDPOINT
  if (endpoint.toLowerCase() === 'globalmarketcap') {
    validator.validated.data.field = 'total_mcap'
  }

  const jobRunID = validator.validated.id
  const url = `global`
  const symbol = validator.validated.data.base || 'btc'
  let field = validator.validated.data.path || 'd'
  if (field === 'd') field = `${symbol.toLowerCase()}_d`

  const options = {
    ...config.api,
    url,
  }

  const response = await Requester.request(options)
  response.data.result = Requester.validateResultNumber(response.data[0], [field])
  return Requester.success(jobRunID, response, config.verbose)
}
