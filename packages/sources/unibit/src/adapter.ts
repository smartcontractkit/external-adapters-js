import { InputParameters, Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, ExecuteFactory, Config } from '@chainlink/ea-bootstrap'
import { makeConfig, DEFAULT_ENDPOINT } from './config'
import { historical, TInputParameters as EndpointInputParams } from './endpoint'

export type TInputParameters = Record<string, never>
export const inputParams: InputParameters<TInputParameters> = {}

export type TInputParams = EndpointInputParams & TInputParameters

export const execute: ExecuteWithConfig<Config> = async (request, context, config) => {
  const validator = new Validator(request, inputParams)

  Requester.logConfig(config)

  const endpoint = validator.validated.data.endpoint || DEFAULT_ENDPOINT

  switch (endpoint) {
    default: {
      return await historical.execute(request, context, config)
    }
  }
}

export const makeExecute: ExecuteFactory<Config, TInputParams> = (config) => {
  return async (request, context) => execute(request, context, config || makeConfig())
}
