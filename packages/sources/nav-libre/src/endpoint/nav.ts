import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { navLibreTransport } from '../transport/nav'

export const inputParameters = new InputParameters(
  {
    globalFundID: {
      required: true,
      type: 'number',
      description: 'The global fund ID for the Libre fund',
    },
  },
  [
    {
      globalFundID: 1234,
    },
  ],
)
export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: {
    Result: number
    Data: {
      navPerShare: number
      navDate: string
      globalFundID: number
    }
  }
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'nav',
  transport: navLibreTransport,
  inputParameters,
})
