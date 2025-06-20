import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { httpTransport } from '../transport/price'

export const inputParameters = new InputParameters(
  {
    token: {
      type: 'string',
      default: 'USYC',
      description: 'The token to get the price report for. Currently only USYC is supported.',
    },
  },
  [
    {
      token: 'USYC',
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: {
    Result: string
    Data: {
      result: string
    }
  }
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'price',
  aliases: [],
  transport: httpTransport,
  inputParameters,
})
