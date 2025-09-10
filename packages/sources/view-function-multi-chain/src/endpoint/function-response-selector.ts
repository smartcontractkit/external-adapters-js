import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { multiChainFunctionResponseSelectorTransport } from '../transport/function-response-selector'
import { inputParamDefinition as functionInputParamDefinition } from './function'

const inputParameters = new InputParameters({
  ...functionInputParamDefinition,
  resultField: {
    required: true,
    description:
      "If present, returns the named parameter specified from the signature's response. Has precedence over resultIndex.",
    type: 'string',
  },
})

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: {
    Data: {
      result: string
    }
    Result: string
  }
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'function-response-selector',
  transport: multiChainFunctionResponseSelectorTransport,
  inputParameters,
})
