import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { cantonDataTransport } from '../transport/canton-data'

export const inputParameters = new InputParameters(
  {
    contractId: {
      description: 'The contract ID to exercise choice on',
      type: 'string',
      required: false,
    },
  },
  [
    {
      contractId: '00e1f5c6d8b9a7f4e3c2d1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0',
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: {
    Data: {
      result: string
      exerciseResult: any
      contract?: any
    }
    Result: string
  }
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'canton-data',
  aliases: [],
  transport: cantonDataTransport,
  inputParameters,
})
