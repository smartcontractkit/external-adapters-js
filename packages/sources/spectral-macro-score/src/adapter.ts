import { Requester, Validator, AdapterError } from '@chainlink/ea-bootstrap'
import {
  ExecuteFactory,
  AdapterRequest,
  AdapterContext,
  AdapterResponse,
} from '@chainlink/ea-bootstrap'
import { makeConfig, DEFAULT_ENDPOINT, SpectralAdapterConfig } from './config'
import { MacroScoreAPI } from './endpoint'

const inputParams = {
  tokenIdInt: true,
  tickSetId: true,
}

export const execute = async (
  request: AdapterRequest,
  _: AdapterContext,
  config: SpectralAdapterConfig,
): Promise<AdapterResponse> => {
  const validator = new Validator(request, inputParams)

  Requester.logConfig(config)

  request.data.jobRunID = validator.validated.id
  const endpoint = validator.validated.data.endpoint || DEFAULT_ENDPOINT

  switch (endpoint.toLowerCase()) {
    case MacroScoreAPI.MacroScoreAPIName: {
      return await MacroScoreAPI.execute(request, config)
    }
    default: {
      throw new AdapterError({
        jobRunID: request.data.jobRunID,
        message: `Endpoint ${endpoint} not supported.`,
        statusCode: 400,
      })
    }
  }
}

export const makeExecute: ExecuteFactory<SpectralAdapterConfig> = (config) => {
  return async (request, context) => execute(request, context, config || makeConfig())
}
