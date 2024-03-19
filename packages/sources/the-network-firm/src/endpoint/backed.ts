import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { config } from '../config'
import { httpTransport } from '../transport/backed'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'

export const inputParameters = new InputParameters(
  {
    accountName: {
      type: 'string',
      description: 'The account name to retrieve the total reserve for',
      required: true,
    },
  },
  [
    {
      accountName: 'IBTA',
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
  name: 'backed',
  transport: httpTransport,
  inputParameters,
})
