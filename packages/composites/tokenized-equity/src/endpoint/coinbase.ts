import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { issuers } from '../issuers'
import { coinbaseTransport } from '../transport/coinbaseTransport'
import type { output } from './common'
import { inputDefinition, inputExample, smoothedPriceInputValidation } from './common'

export const inputParameters = new InputParameters(
  {
    registry: {
      required: true,
      type: 'string',
      description: 'Coinbase on-chain registry address',
    },
    ...inputDefinition.definition,
  },
  [
    {
      registry: '0x0',
      ...inputExample,
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: {
    Result: string
    Data: output & {
      registry: {
        multiplier: string
        paused: boolean
      }
    }
  }
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'coinbase',
  aliases: [],
  transport: coinbaseTransport,
  inputParameters,
  customInputValidation: smoothedPriceInputValidation(issuers.coinbase),
})
