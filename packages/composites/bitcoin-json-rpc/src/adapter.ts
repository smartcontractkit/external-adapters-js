import JSONRPC from '@chainlink/json-rpc-adapter'
import { Config, ExecuteWithConfig, ExecuteFactory } from '@chainlink/types'
import { Validator, AdapterError } from '@chainlink/ea-bootstrap'
import { DEFAULT_ENDPOINT } from './config'
import { getblockchaininfo, scantxoutset } from './endpoint'

const inputParams = {
  endpoint: false,
}

// Export function to integrate with Chainlink node
export const execute: ExecuteWithConfig<Config> = async (request, context, config) => {
  const validator = new Validator(request, inputParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const endpoint = validator.validated.data.endpoint || DEFAULT_ENDPOINT
  switch (endpoint.toLowerCase()) {
    case 'difficulty':
    case getblockchaininfo.NAME: {
      return getblockchaininfo.execute(request, context, config)
    }
    case scantxoutset.NAME: {
      return scantxoutset.execute(request, context, config)
    }
    default: {
      throw new AdapterError({
        jobRunID,
        message: `Endpoint ${endpoint} not supported.`,
        statusCode: 400,
      })
    }
  }
}

export const makeExecute: ExecuteFactory<Config> = (config) => {
  return async (request, context) => execute(request, context, config || JSONRPC.makeConfig())
}
