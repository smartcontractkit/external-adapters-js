import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { config } from '../config'
import { issuerDirectory } from '../issuers'
import { robinhoodTransport } from '../transport/robinhoodTransport'
import type { output } from './common'
import { inputDefinition, inputExample, validateSmoother, validateStreamIds } from './common'

export const inputParameters = new InputParameters(
  {
    ...inputDefinition.definition,
    network: {
      type: 'string',
      description:
        'Identifier to determine which RPC URL to use. Corresponds to ROBINHOOD_${NETWORK}_RPC_URL environment variable.',
      default: 'mainnet',
    },
    // Repeat asset parameter from the share definition to override the
    // description.
    asset: {
      required: true,
      type: 'string',
      description: 'Token address of the asset on the Robinhood chain',
    },
  },
  [
    {
      network: 'mainnet',
      ...inputExample,
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: {
    Result: string
    Data: output & {
      tokenContract: {
        multiplier: string
        paused: boolean
      }
    }
  }
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'robinhood',
  aliases: [],
  transport: robinhoodTransport,
  inputParameters,
  customInputValidation: (req, adapterSettings): AdapterInputError | undefined => {
    const { data } = req.requestContext
    issuerDirectory.robinhood.validate(adapterSettings, data)

    validateStreamIds(data)
    validateSmoother(data)

    return
  },
})
