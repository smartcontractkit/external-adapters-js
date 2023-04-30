import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import {
  BurnedResponseSchema,
  TotalBurnedTransport,
  baseInputParametersDefinition,
} from './total-burned'

const inputParameters = new InputParameters({
  ...baseInputParametersDefinition,
  startTime: {
    description:
      'The start time for the queried period. See [Supported DateTime Formats](#supported-datetime-formats)',
    type: 'string',
    required: false,
  },
  endTime: {
    description:
      'The end time for the queried period. See [Supported DateTime Formats](#supported-datetime-formats)',
    type: 'string',
    required: false,
  },
})

export type EndpointTypes = {
  Parameters: typeof inputParameters.definition
  Settings: typeof config.settings
  Response: SingleNumberResultResponse
  Provider: {
    RequestBody: never
    ResponseBody: BurnedResponseSchema
  }
}

export const endpoint = new AdapterEndpoint<EndpointTypes>({
  name: 'burned',
  transport: new TotalBurnedTransport<EndpointTypes>(),
  inputParameters,
})
