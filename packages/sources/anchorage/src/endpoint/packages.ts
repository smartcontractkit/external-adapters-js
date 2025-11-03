import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { config } from '../config'
import { packagesTransport } from '../transport/packages'

export const inputParameters = new InputParameters(
  {
    clientReferenceId: {
      required: true,
      type: 'string',
      description: 'Id of the vault',
    },
    assetType: {
      required: true,
      type: 'string',
      description: 'Asset ticker name',
    },
  },
  [
    {
      clientReferenceId: '123456',
      assetType: 'BTC',
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: SingleNumberResultResponse
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'packages',
  transport: packagesTransport,
  inputParameters,
  customInputValidation: (_, adapterSettings): AdapterInputError | undefined => {
    if (!adapterSettings.COLLATERAL_API_KEY) {
      throw new AdapterInputError({
        message: 'Missing COLLATERAL_API_KEY',
        statusCode: 400,
      })
    }
    return
  },
})
