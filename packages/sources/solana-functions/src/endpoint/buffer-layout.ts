import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { bufferLayoutTransport } from '../transport/buffer-layout'

export const inputParameters = new InputParameters(
  {
    stateAccountAddress: {
      description: 'The state account address for the program',
      type: 'string',
      required: true,
    },
    field: {
      description: 'The name of the field to retrieve from the state account',
      type: 'string',
      required: true,
    },
    extraFields: {
      description: 'The names of other fields to retrieve from the state account',
      type: 'string',
      required: false,
      array: true,
    },
  },
  [
    {
      stateAccountAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      field: 'supply',
      extraFields: [],
    },
  ],
)

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
  name: 'buffer-layout',
  aliases: [],
  transport: bufferLayoutTransport,
  inputParameters,
})
