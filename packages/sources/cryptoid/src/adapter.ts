import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, ExecuteFactory } from '@chainlink/types'
import { makeConfig, DEFAULT_ENDPOINT } from './config'

const customParams = {
  blockchain: ['blockchain', 'coin'],
  endpoint: false,
}

const endpointToApiFunctionName: { [key: string]: string } = {
  difficulty: 'getdifficulty',
  height: 'getblockcount',
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

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

export const makeExecute: ExecuteFactory<Config> = (config) => {
  return async (request, context) => execute(request, context, config || makeConfig())
}
