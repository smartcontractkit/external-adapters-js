import { AdapterError, Validator } from '@chainlink/ea-bootstrap'
import { InputParameters, ExecuteWithConfig } from '@chainlink/types'
import { ExtendedConfig } from '../config'
import { poke } from '../method'

export const supportedEndpoints = ['rewards']

const inputParameters: InputParameters = {
  method: {
    required: false,
    type: 'string',
    description: 'The method to call',
    default: 'poke',
  },
}

export const execute: ExecuteWithConfig<ExtendedConfig> = async (request, context, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  const method = validator.validated.data.method

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
