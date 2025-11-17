import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { config, getApiConfig } from '../config'
import { httpTransport } from '../transport/http'

export const inputParameters = new InputParameters(
  {
    apiName: {
      required: true,
      type: 'string',
      description: 'Used as prefix for environment variables to find API config',
    },
    dataPath: {
      required: true,
      type: 'string',
      description: 'The path to the field containing the data to return',
    },
    ripcordPath: {
      required: false,
      type: 'string',
      description: 'The path to the ripcord field if expected',
    },
    ripcordDisabledValue: {
      default: 'false',
      type: 'string',
      description:
        'If the ripcord field has a different value than this, the adapter will return an error.',
    },
  },
  [
    {
      apiName: 'client-name',
      dataPath: 'PoR',
      ripcordPath: 'ripcord',
      ripcordDisabledValue: 'false',
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: {
    Result: string
    Data: {
      result: string
    }
  }
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'http',
  aliases: [],
  transport: httpTransport,
  inputParameters,
  customInputValidation: (request): AdapterError | undefined => {
    getApiConfig(request.requestContext.data.apiName)
    return
  },
})
