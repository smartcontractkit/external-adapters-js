import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { httpTransport } from '../transport/nav'

export const inputParameters = new InputParameters(
  {
    chainType: {
      type: 'string',
      description: 'The chain type (e.g., polygon, sui)',
      required: true,
    },
    tokenName: {
      type: 'string',
      description: 'The token name (e.g., rcusdp)',
      required: true,
    },
  },
  [
    {
      chainType: 'polygon',
      tokenName: 'rcusdp',
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: {
    Result: number
    Data: {
      result: number
      navPerShare: number
      aum: number
      navDate: string
    }
  }
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'nav',
  transport: httpTransport,
  inputParameters,
})
