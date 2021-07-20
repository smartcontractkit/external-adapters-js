import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'

export const supportedEndpoints = ['height', 'difficulty']

export const endpointResultPaths = {
  height: 'headers',
  difficulty: 'difficulty',
}

export const inputParameters: InputParameters = {
  blockchain: ['blockchain', 'coin'],
  resultPath: false,
  network: false,
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const blockchain = validator.validated.data.blockchain
  const network = validator.validated.data.network || 'mainnet'
  const resultPath = validator.validated.data.resultPath
  const url = `/v1/bc/${blockchain.toLowerCase()}/${network.toLowerCase()}/info`

  const reqConfig = { ...config.api, url }

  const response = await Requester.request(reqConfig)
  response.data.result = Requester.validateResultNumber(response.data, ['payload', resultPath])

  return Requester.success(jobRunID, response, config.verbose)
}
