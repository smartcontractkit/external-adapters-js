import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'

export const supportedEndpoints = ['gasprice']

const customError = (data: any) => {
  return Object.keys(data.payload).length < 1
}

export const inputParameters: InputParameters = {
  speed: false,
  blockchain: false,
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const speed = validator.validated.data.speed || 'average'
  const blockchain = validator.validated.data.blockchain || 'ethereum-mainnet'
  const url = '/api/v2/transactions/gas/predictions'

  const options = {
    ...config.api,
    url,
    headers: {
      ...config.api.headers,
      'x-amberdata-blockchain-id': blockchain,
    },
  }

  const response = await Requester.request(options, customError)
  response.data.result = Requester.validateResultNumber(response.data, [
    'payload',
    speed,
    'gasPrice',
  ])

  return Requester.success(jobRunID, response, config.verbose)
}
