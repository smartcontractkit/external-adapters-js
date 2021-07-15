import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'

export const supportedEndpoints = ['assets', 'dominance']

export const endpointResultPaths = {
  dominance: 'marketcap.marketcap_dominance_percent',
  assets: 'marketcap.marketcap_dominance_percent',
}

const customError = (data: any) => {
  if (data.Response === 'Error') return true
  return false
}

export const inputParameters: InputParameters = {
  base: ['base', 'market', 'to', 'quote'],
  resultPath: false,
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const base = validator.validated.data.base.toLowerCase()
  const resultPath = validator.validated.data.resultPath
  const url = `assets/${base}/metrics`

  const options = {
    ...config.api,
    url,
  }

  const response = await Requester.request(options, customError)
  response.data.result = Requester.validateResultNumber(response.data, ['data', resultPath])

  return Requester.success(jobRunID, response, config.verbose)
}
