import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { navTransport } from '../transport/nav'

export const inputParameters = new InputParameters(
  {
    fundId: {
      required: true,
      type: 'number',
      description: 'The fund id of the reserves to query',
    },
  },
  [
    {
      fundId: 3,
    },
  ],
)

export type NavResultResponse = {
  Result: number
  Data: {
    fundId: number
    fundName: string
    netAssetValue: number
    navDate: string
  }
}

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: NavResultResponse //SingleNumberResultResponse
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'nav',
  inputParameters,
  transport: navTransport,
})
