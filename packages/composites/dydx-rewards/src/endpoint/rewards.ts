import { AdapterInputError, Validator } from '@chainlink/ea-bootstrap'
import { InputParameters, ExecuteWithConfig } from '@chainlink/ea-bootstrap'
import { ExtendedConfig } from '../config'
import { poke } from '../method'

export const supportedEndpoints = ['rewards']

export type TInputParameters = {
  method?: string
}

const inputParameters: InputParameters<TInputParameters> = {
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
  const method = validator.validated.data.method as string
  // TODO: non-nullable default types

  switch (method.toLowerCase()) {
    case poke.NAME: {
      return await poke.execute(request, context, config)
    }
    default: {
      throw new AdapterInputError({
        jobRunID,
        message: `Method ${method} not supported.`,
        statusCode: 400,
      })
    }
  }
}
