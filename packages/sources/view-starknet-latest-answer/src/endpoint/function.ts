import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { starknetLatestAnswerFunctionTransport } from '../transport/function'

export const inputParameters = new InputParameters({
  address: {
    aliases: ['contract'],
    required: true,
    description: 'Address of the contract',
    type: 'string',
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
  name: 'function',
  transport: starknetLatestAnswerFunctionTransport,
  inputParameters,
})
