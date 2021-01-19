import { legos } from '@chainlink/adapter-legos'
import { Config, ExecuteWithConfig, ExecuteFactory, AdapterRequest } from '@chainlink/types'
import { Validator, Requester } from '@chainlink/external-adapter'
import { DEFAULT_ENDPOINT, makeConfig } from './config'

const inputParams = {
  endpoint: false,
}

const convertEndpoint: { [key: string]: string } = {
  height: 'headers',
}

// Export function to integrate with Chainlink node
const execute: ExecuteWithConfig<Config> = async (request: AdapterRequest) => {
  const validator = new Validator(request, inputParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  let endpoint = validator.validated.data.endpoint || DEFAULT_ENDPOINT

  const response = await legos.jsonrpc.execute({
    ...request,
    data: { ...request.data, method: 'getblockchaininfo' },
  })

  endpoint = convertEndpoint[endpoint] || endpoint
  const result = Requester.validateResultNumber(response.data, ['result', endpoint])
  return Requester.success(jobRunID, {
    data: { ...response.data.result, result },
    result,
    status: 200,
  })
}

export const makeExecute: ExecuteFactory<Config> = (config) => {
  return async (request) => execute(request, config || makeConfig())
}
