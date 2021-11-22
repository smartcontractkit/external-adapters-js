import { Validator } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, InputParameters } from '@chainlink/types'
import { totalBurned } from '.'

export const supportedEndpoints = ['burned']

export const inputParameters: InputParameters = {
  asset: true,
  frequency: false,
}

export const execute: ExecuteWithConfig<Config> = async (request, context, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

  request.data.pageSize = 1
  request.data.isBurnedEndpointMode = true

  return totalBurned.execute(request, context, config)
}
