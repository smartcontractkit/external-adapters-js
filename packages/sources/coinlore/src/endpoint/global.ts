import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters, EndpointResultPaths } from '@chainlink/types'

export const supportedEndpoints = ['global', 'globalmarketcap', 'dominance']

export const endpointResultPaths: EndpointResultPaths = {
  globalmarketcap: 'total_mcap',
  dominance: 'd',
  global: 'd',
}

export const inputParameters: InputParameters = {
  base: false,
  resultPath: false,
  endpoint: false,
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const url = `global`
  const symbol = validator.validated.data.base || 'btc'
  let resultPath = validator.validated.data.resultPath
  if (resultPath === 'd') resultPath = `${symbol.toLowerCase()}_d`

  const options = {
    ...config.api,
    url,
  }

  const response = await Requester.request(options)
  response.data.result = Requester.validateResultNumber(response.data[0], [resultPath])
  return Requester.success(jobRunID, response, config.verbose)
}
