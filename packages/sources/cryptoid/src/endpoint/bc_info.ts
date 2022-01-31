import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, InputParameters } from '@chainlink/types'
import { DEFAULT_ENDPOINT } from '../config'

export const supportedEndpoints = ['height', 'difficulty']

export const inputParameters: InputParameters = {
  blockchain: {
    aliases: ['coin'],
    required: true,
    type: 'string',
    description: 'The blockchain name.',
  },
  endpoint: {
    description: 'Name of the endpoint to use',
    required: false,
    type: 'string',
  },
}

const endpointToApiFunctionName: { [key: string]: string } = {
  difficulty: 'getdifficulty',
  height: 'getblockcount',
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  Requester.logConfig(config)

  const jobRunID = validator.validated.id
  const endpoint = validator.validated.data.endpoint || DEFAULT_ENDPOINT
  const blockchain = validator.validated.data.blockchain.toLowerCase()

  const key = config.apiKey
  const apiFunctionName = endpointToApiFunctionName[endpoint]
  const params = { key, q: apiFunctionName }

  const reqConfig = {
    ...config.api,
    params,
    baseURL: config.api.baseURL || `https://${blockchain}.cryptoid.info/${blockchain}/api.dws`,
  }
  const response = await Requester.request(reqConfig)
  response.data = { result: response.data }

  return Requester.success(jobRunID, response, config.verbose)
}
