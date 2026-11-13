import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { config } from '../config'
import { coinbaseTransport } from '../transport/coinbaseTransport'
import type { output } from './common'
import { inputDefinition, inputExample, validateSmoother, validateStreamIds } from './common'

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
  customInputValidation: (req, adapterSettings): AdapterInputError | undefined => {
    if (!adapterSettings.BASE_RPC_URL) {
      throw new AdapterInputError({
        message: 'Missing BASE_RPC_URL',
        statusCode: 400,
      })
    }

    validateStreamIds(req.requestContext.data)
    validateSmoother(req.requestContext.data)

    return
  },
})
