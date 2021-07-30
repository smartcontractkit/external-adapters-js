import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'
import { COINS } from '../config'

export const supportedEndpoints = ['stats', 'height', 'difficulty']

export const endpointResultPaths = {
  stats: 'stats',
  height: 'blocks',
  difficulty: 'difficulty',
}

export const inputParameters: InputParameters = {
  blockchain: ['blockchain', 'coin'],
  resultPath: false,
}

export const execute: ExecuteWithConfig<Config> = async (input, _, config) => {
  const validator = new Validator(input, inputParameters)
  if (validator.error) throw validator.error
  const jobRunID = validator.validated.id
  const resultPath = validator.validated.data.resultPath

  const blockchain = Requester.toVendorName(
    validator.validated.data.blockchain.toLowerCase(),
    COINS,
  )
  const url = `/${blockchain}/stats`

  const reqConfig = { ...config.api, url }

  const response = await Requester.request(reqConfig)
  response.data.result = Requester.validateResultNumber(response.data, ['data', resultPath])
  return Requester.success(jobRunID, response)
}
