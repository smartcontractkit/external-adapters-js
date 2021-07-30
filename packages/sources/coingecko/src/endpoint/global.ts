import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, InputParameters } from '@chainlink/types'

export const supportedEndpoints = ['globalmarketcap', 'dominance']

export const endpointResultPaths = {
  globalmarketcap: 'total_market_cap',
  dominance: 'market_cap_percentage',
}

const customError = (data: any) => {
  if (Object.keys(data).length === 0) return true
  return false
}

export const inputParameters: InputParameters = {
  market: ['quote', 'to', 'market', 'coin'],
  resultPath: false,
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error
  const jobRunID = validator.validated.id
  const market = validator.validated.data.market.toLowerCase()
  const resultPath = validator.validated.data.resultPath

  const url = '/global'

  const options = {
    ...config.api,
    url,
    params: {
      x_cg_pro_api_key: config.apiKey,
    },
  }

  const response = await Requester.request(options, customError)
  response.data.result = Requester.validateResultNumber(response.data, ['data', resultPath, market])

  return Requester.success(jobRunID, response, config.verbose)
}
