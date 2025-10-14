import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { cantonDataTransport } from '../transport/canton-data'

export const inputParameters = new InputParameters(
  {
    templateId: {
      description: 'The template ID to query contracts for (format: packageId:Module:Template)',
      type: 'string',
      required: true,
    },
  },
  [
    {
      templateId: 'example-package-id:Main:Asset',
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: {
    Data: {
      result: string
      contracts: any[]
    }
    Result: string
  }
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'canton-data',
  aliases: [],
  transport: cantonDataTransport,
  inputParameters,
})
