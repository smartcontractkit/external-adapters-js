import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { glvPriceTransport } from '../transport/glv-price'
import { CHAIN_OPTIONS } from '../transport/shared/chain'

export const glvPriceInputParameters = new InputParameters(
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

export type GlvPriceEndpointTypes = {
  Parameters: typeof glvPriceInputParameters.definition
  Response: SingleNumberResultResponse & {
    Data: {
      result: number
      mid: number
      bid: number
      ask: number
      sources: Record<string, string[]>
    }
  }
  Settings: typeof config.settings
}

export const glvPriceEndpoint = new AdapterEndpoint({
  name: 'glv-price',
  aliases: ['glv-crypto-lwba'],
  transport: glvPriceTransport,
  inputParameters: glvPriceInputParameters,
})
