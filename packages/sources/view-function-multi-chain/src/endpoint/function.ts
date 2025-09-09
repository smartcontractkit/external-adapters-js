import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { config } from '../config'
import {
  multiChainFunctionResponseSelectorTransport,
  multiChainFunctionTransport,
} from '../transport/function'

export const inputParameters = new InputParameters({
  signature: {
    type: 'string',
    aliases: ['function'],
    required: true,
    description:
      'Function signature. Should be formatted as [human readable ABI](https://docs.ethers.io/v5/single-page/#/v5/getting-started/-%23-getting-started--contracts)',
  },
  address: {
    aliases: ['contract'],
    required: true,
    description: 'Address of the contract',
    type: 'string',
  },
  inputParams: {
    array: true,
    description: 'Array of function parameters in order',
    type: 'string',
  },
  network: {
    required: true,
    description: 'RPC network name',
    type: 'string',
  },
  resultField: {
    required: false,
    description:
      "If present, returns the named parameter specified from the signature's response. Has precedence over resultIndex.",
    type: 'string',
  },
  resultIndex: {
    required: false,
    description:
      "If present, returns the 0-indexed parameter specified from the signature's response",
    type: 'number',
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

export const functionEndpoint = new AdapterEndpoint({
  name: 'function',
  transport: multiChainFunctionTransport,
  inputParameters,
  customInputValidation: (req): AdapterInputError | undefined => {
    if (
      req.requestContext.data.resultField != null ||
      req.requestContext.data.resultIndex != null
    ) {
      throw new AdapterInputError({
        statusCode: 400,
        message: `resultField and resultIndex should not be set, use endpoint function-responseSelector instead`,
      })
    }
    return
  },
})

export const functionResponseSelectorEndpoint = new AdapterEndpoint({
  name: 'function-responseSelector',
  transport: multiChainFunctionResponseSelectorTransport,
  inputParameters,
  customInputValidation: (req): AdapterInputError | undefined => {
    if (
      req.requestContext.data.resultField == null &&
      req.requestContext.data.resultIndex == null
    ) {
      throw new AdapterInputError({
        statusCode: 400,
        message: `One of resultField and resultIndex should be present`,
      })
    }
    return
  },
})
