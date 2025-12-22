import {
  AdapterEndpoint,
  LwbaResponseDataFields,
} from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { glvLwbaTransport } from '../transport/glv-lwba'
import { CHAIN_OPTIONS } from './gm-price'

export const glvLwbaInputParameters = new InputParameters(
  {
    glv: {
      required: true,
      type: 'string',
      description: 'Glv address',
    },
    chain: {
      description: 'Target chain for GLV market',
      type: 'string',
      options: [...CHAIN_OPTIONS],
      default: 'arbitrum',
    },
  },
  [
    {
      glv: '0x528A5bac7E746C9A509A1f4F6dF58A03d44279F9',
      chain: 'arbitrum',
    },
  ],
)

export type GlvLwbaEndpointTypes = {
  Parameters: typeof glvLwbaInputParameters.definition
  Response: LwbaResponseDataFields & {
    Data: {
      sources: Record<string, string[]>
    }
  }
  Settings: typeof config.settings
}

export const glvLwbaEndpoint = new AdapterEndpoint({
  name: 'glv-crypto-lwba',
  aliases: ['crypto-lwba'],
  transport: glvLwbaTransport,
  inputParameters: glvLwbaInputParameters,
})
