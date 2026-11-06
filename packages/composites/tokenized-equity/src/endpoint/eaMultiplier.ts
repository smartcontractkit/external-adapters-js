import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { config } from '../config'
import { eaMultiplierTransport } from '../transport/eaMultiplierTransport'
import type { output } from './common'
import { inputDefinition, inputExample, smoothedPriceInputValidation } from './common'

export const inputParameters = new InputParameters(
  {
    sourceAdapter: {
      required: true,
      type: 'string',
      description:
        'Name of the EA to request multiplier from, the source EA data must return multiplier, newMultiplier and activationDateTime',
    },
    params: {
      required: true,
      type: 'string',
      description: 'JSON string encoding the parameters to be passed to the sourceAdapter',
    },
    ...inputDefinition.definition,
  },
  [
    {
      sourceAdapter: 'SOLANA_FUNCTIONS',
      params:
        '{"endpoint":"extension","stateAccountAddress":"6V4gLu7aC63e6CTEJXu71wtx5FMrZ3FQoST7UXXqgPuQ","extensionDataOffset":166,"extensionFields":[{"extensionType":25,"name":"multiplier","offset":32,"type":"float64"},{"extensionType":25,"name":"activationDateTime","offset":40,"type":"int64"},{"extensionType":25,"name":"newMultiplier","offset":48,"type":"float64"}]}',
      ...inputExample,
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: {
    Result: string
    Data: output & {
      currentMultiplier: number
      newMultiplier: number
      activationDateTime: number
      scaledUiAmount: {
        multiplier: string
        newMultiplier: string
        newMultiplierEffectiveTimestamp: number
      }
    }
  }
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'ea-multiplier',
  aliases: [],
  transport: eaMultiplierTransport,
  inputParameters,
  customInputValidation: (req, settings): AdapterInputError | undefined => {
    settings.SOURCE_ADAPTER_URL.get(req.requestContext.data.sourceAdapter)
    try {
      JSON.parse(req.requestContext.data.params)
    } catch (e) {
      throw new AdapterInputError({
        statusCode: 400,
        message: `Invalid params: ${e}`,
      })
    }
    return smoothedPriceInputValidation()(req, settings)
  },
})
