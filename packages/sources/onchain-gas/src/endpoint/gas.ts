import { Validator } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, InputParameters } from '@chainlink/types'

// This should be filled in with a lowercase name corresponding to the API endpoint
export const supportedEndpoints = ['gas']

export const inputParameters: InputParameters = {}

export const execute: ExecuteWithConfig<Config> = async (request) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error
  throw Error(
    'The OnChain Gas adapter does not support making HTTP requests. Make sure WS is enabled in the adapter configuration.',
  )
}
