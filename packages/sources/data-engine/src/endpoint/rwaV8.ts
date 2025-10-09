import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { rwaV8Transport } from '../transport/rwaV8'

export const inputParameters = new InputParameters(
  {
    feedId: {
      required: true,
      type: 'string',
      description: 'The feedId for RWA feed with v8 schema',
    },
  },
  [
    {
      feedId: '0x0008707410e2c111fb0e80cab2fa004b215eea2d95b106e700243f9ebcc8fbd9',
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: {
    Result: null
    Data: {
      midPrice: string
      marketStatus: number
      decimals: number
    }
  }
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'rwa-v8',
  aliases: [],
  transport: rwaV8Transport,
  inputParameters,
})
