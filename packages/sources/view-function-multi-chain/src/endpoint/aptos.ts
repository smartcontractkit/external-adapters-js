import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { config } from '../config'
import { aptosTransport } from '../transport/aptos'

export const inputParameters = new InputParameters({
  signature: {
    type: 'string',
    aliases: ['function'],
    required: true,
    description: 'Function signature. Format: {address}::{module name}::{function name}',
  },
  arguments: {
    array: true,
    description: 'Arguments of the function',
    type: 'string',
  },
  type: {
    array: true,
    description: 'Type arguments of the function',
    type: 'string',
  },
  index: {
    description: 'Which item in the function output array to return',
    type: 'number',
    default: 0,
  },
})

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: {
    Data: {
      result: string
    }
    Result: string
  }
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'aptos',
  transport: aptosTransport,
  inputParameters,
  customInputValidation: (_, adapterSettings): AdapterInputError | undefined => {
    if (!adapterSettings['APTOS_URL']) {
      throw new AdapterInputError({
        statusCode: 400,
        message: `Error: missing environment variable APTOS_URL`,
      })
    }
    return
  },
})
