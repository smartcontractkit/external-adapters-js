import { AdapterError, Validator } from '@chainlink/ea-bootstrap'
import { InputParameters, ExecuteWithConfig } from '@chainlink/types'
import { DEFAULT_METHOD, ExtendedConfig } from '../config'
import { poke } from '../method'

export const supportedEndpoints = ['rewards']

const inputParams: InputParameters = {
  method: {
    required: false,
    description: 'The method to call',
  },
}

export const execute: ExecuteWithConfig<ExtendedConfig> = async (request, context, config) => {
  const validator = new Validator(request, inputParams)

  const jobRunID = validator.validated.id
  const method = validator.validated.data.method || DEFAULT_METHOD

  switch (method.toLowerCase()) {
    case poke.NAME: {
      return await poke.execute(request, context, config)
    }
    default: {
      throw new AdapterError({
        jobRunID,
        message: `Method ${method} not supported.`,
        statusCode: 400,
      })
    }
  }
}
