import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { httpTransport } from '../transport/balance'

export const inputParameters = new InputParameters(
  {
    clientName: {
      required: true,
      type: 'string',
      description: 'The name of the client to retrieve balances for.',
    },
  },
  [
    {
      clientName: 'TUSD',
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: {
    Result: number
    Data: {
      result: number
      ripcord: boolean
    }
  }
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'balance',
  transport: httpTransport,
  inputParameters,
})
