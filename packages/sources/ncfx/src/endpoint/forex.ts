import { Validator } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, InputParameters } from '@chainlink/types'

export const supportedEndpoints = ['forex']

export const inputParameters: InputParameters = {
  base: ['base', 'from', 'coin'],
  quote: ['quote', 'to', 'market'],
}

export const execute: ExecuteWithConfig<Config> = async (request) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error
  throw Error(
    'The NCFX adapter does not support making HTTP requests. Make sure WS is enabled in the adapter configuration.',
  )
}
