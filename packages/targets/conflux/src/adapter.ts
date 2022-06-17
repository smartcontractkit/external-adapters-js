import {
  Requester,
  Validator,
  AdapterInputError,
  InputParameters,
  ExecuteFactory,
} from '@chainlink/ea-bootstrap'
import { AdapterResponse, ExecuteWithConfig } from '@chainlink/ea-bootstrap'
import { makeConfig, DEFAULT_ENDPOINT, Config } from './config'
import { conflux, TInputParameters as EndpointInputParams } from './endpoint'

export type TInputParameters = Record<string, never>
export const inputParams: InputParameters<TInputParameters> = {}

export type TInputParams = EndpointInputParams & TInputParameters

export const execute: ExecuteWithConfig<Config, TInputParameters> = async (
  request,
  context,
  config,
): Promise<AdapterResponse> => {
  const validator = new Validator(request, inputParams)

  Requester.logConfig(config)

  const jobRunID = validator.validated.id
  const endpoint = validator.validated.data.endpoint || DEFAULT_ENDPOINT

  switch (endpoint) {
    case conflux.NAME: {
      return await conflux.execute(request, context, config)
    }
    default: {
      throw new AdapterInputError({
        jobRunID,
        message: `Endpoint ${endpoint} not supported.`,
        statusCode: 400,
      })
    }
  }
}

export const makeExecute: ExecuteFactory<Config, TInputParams> = (config) => {
  return async (request, context) => execute(request, context, config || makeConfig())
}
