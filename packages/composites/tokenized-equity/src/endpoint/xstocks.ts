import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { config } from '../config'
import { xstocksTransport } from '../transport/xstocksTransport'
import type { output } from './common'
import { inputDefinition, inputExample, validateSmoother, validateStreamIds } from './common'

export const inputParameters = new InputParameters(
  {
    ...inputDefinition.definition,
    // Repeat asset parameter from the shared definition to override the
    // description.
    asset: {
      required: true,
      type: 'string',
      description: 'Token address of the Xstocks asset on Ethereum Mainnet',
    },
  },
  [inputExample],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: {
    Result: string
    Data: output & {
      tokenContract: {
        multiplier: string
      }
    }
  }
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'xstocks',
  aliases: [],
  transport: xstocksTransport,
  inputParameters,
  customInputValidation: (req, adapterSettings): AdapterInputError | undefined => {
    if (!adapterSettings.ETHEREUM_RPC_URL) {
      throw new AdapterInputError({
        message: 'Missing ETHEREUM_RPC_URL',
        statusCode: 400,
      })
    }

    validateStreamIds(req.requestContext.data)
    validateSmoother(req.requestContext.data)

    return
  },
})
