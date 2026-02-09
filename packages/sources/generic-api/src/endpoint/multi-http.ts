import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { TypeFromDefinition } from '@chainlink/external-adapter-framework/validation/input-params'
import { config, getApiConfig } from '../config'
import { multiHttpTransport } from '../transport/multi-http'

export const inputParameters = new InputParameters(
  {
    apiName: {
      required: true,
      type: 'string',
      description: 'Used as prefix for environment variables to find API config',
    },
    dataPaths: {
      description: 'Array of data paths to extract from the API response',
      required: true,
      array: true,
      type: {
        name: {
          type: 'string',
          required: true,
          description: 'Name of the field in the output response',
        },
        path: {
          type: 'string',
          required: true,
          description: 'JSON path to extract from API response',
        },
      },
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
    providerIndicatedTimePath: {
      required: false,
      type: 'string',
      description:
        'JSON path to extract the timestamp from the API response. Supports ISO 8601 datetime strings (e.g., "2026-01-19T06:56:22.194Z") or Unix milliseconds (number). The value will be placed in timestamps.providerIndicatedTimeUnixMs.',
    },
  },
  [
    {
      apiName: 'NX8',
      dataPaths: [
        { name: 'result', path: 'net_asset_value' },
        { name: 'nav', path: 'net_asset_value' },
        { name: 'aum', path: 'asset_under_management' },
      ],
      ripcordPath: 'ripcord',
      ripcordDisabledValue: 'false',
      providerIndicatedTimePath: 'updatedAt',
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: {
    Data: {
      [key: string]: number | string | boolean
    }
    Result: number | string | null
  }
  Settings: typeof config.settings
}

export type RequestParams = TypeFromDefinition<BaseEndpointTypes['Parameters']>

export const endpoint = new AdapterEndpoint({
  name: 'multi-http',
  transport: multiHttpTransport,
  inputParameters,
  customInputValidation: (request): AdapterError | undefined => {
    getApiConfig(request.requestContext.data.apiName as string)
    return
  },
})
