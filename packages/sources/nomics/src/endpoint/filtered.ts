import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'
import { NAME as AdapterName } from '../config'

export const supportedEndpoints = ['filtered']

export const endpointResultPaths = {
  filtered: 'price',
}

const customError = (data: any) => {
  return Object.keys(data).length === 0
}

export const inputParameters: InputParameters = {
  base: ['base', 'from', 'coin', 'id'],
  exchanges: ['exchanges'],
  resultPath: false,
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

  const symbol = validator.overrideSymbol(AdapterName)
  const jobRunID = validator.validated.id
  const exchanges = validator.validated.data.exchanges
  const resultPath = validator.validated.data.resultPath

  const url = `/prices/restricted`

  const params = {
    currency: symbol,
    key: config.apiKey,
    exchanges: exchanges,
  }
  const reqConfig = {
    ...config.api,
    url,
    params,
  }

  const response = await Requester.request(reqConfig, customError)

  const result = Requester.validateResultNumber(response.data, resultPath)
  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
