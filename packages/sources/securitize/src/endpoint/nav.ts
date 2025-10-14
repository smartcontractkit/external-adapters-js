import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { config } from '../config'
import { getPubKeys, httpTransport } from '../transport/nav'

export const inputParameters = new InputParameters(
  {
    assetId: {
      required: true,
      type: 'string',
      description: 'The assetId of the fund',
    },
    envVarPrefix: {
      required: true,
      type: 'string',
      description: 'Maps the assetId to the {envVarPrefix.toUpperCase()}_PUBKEYS env var',
    },
  },
  [
    {
      assetId: 'c52c3d79-8317-4692-86f8-4e0dfd508672',
      envVarPrefix: 'testAsset',
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: SingleNumberResultResponse
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'nav',
  transport: httpTransport,
  inputParameters,
  customInputValidation: (req): AdapterInputError | undefined => {
    getPubKeys(req.requestContext.data.envVarPrefix)
    return
  },
})
