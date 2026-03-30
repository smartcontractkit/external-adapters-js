import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import {
  AdapterError,
  AdapterInputError,
} from '@chainlink/external-adapter-framework/validation/error'
import { TypeFromDefinition } from '@chainlink/external-adapter-framework/validation/input-params'
import { config } from '../config'
import { calculatedMultiFunctionTransport } from '../transport/calculated-multi-function'
import { aptosBaseInputParameters, doAptosCustomInputValidation } from '../utils/aptos-common'
import { validateOperations } from '../utils/operations'

export const inputParameters = new InputParameters(
  {
    functionCalls: {
      description: 'Array of EVM view-function calls to be made',
      required: false,
      array: true,
      type: {
        name: {
          type: 'string',
          required: true,
          description: 'Name of the function call result',
        },
        signature: {
          type: 'string',
          required: true,
          description:
            'Function signature. Should be formatted as [human readable ABI](https://docs.ethers.io/v5/single-page/#/v5/getting-started/-%23-getting-started--contracts)',
        },
        address: {
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
        decimals: {
          required: false,
          description:
            'Number of decimals to scale the decoded result by. E.g. decimals=7 will divide the raw integer by 1e7, turning 12345678 into 1.2345678',
          type: 'number',
        },
      },
    },
    aptosCalls: {
      description: 'Array of Aptos view-function calls to be made',
      required: false,
      array: true,
      type: {
        name: {
          type: 'string',
          required: true,
          description: 'Name of the function call result',
        },
        ...aptosBaseInputParameters,
      },
    },
    constants: {
      description: 'Constant value to be included in the response',
      required: false,
      array: true,
      type: {
        name: {
          type: 'string',
          required: true,
          description: 'Name of the constant result',
        },
        value: {
          type: 'string',
          required: true,
          description: 'Value of the constant',
        },
      },
    },
    operations: {
      description: 'Results derived from other results by applying basic operations',
      required: false,
      array: true,
      type: {
        name: {
          required: true,
          type: 'string',
          description: 'Name of the derived result',
        },
        type: {
          required: true,
          type: 'string',
          description: 'The operation or source of the derived result',
          options: [
            'select',
            'multiply',
            'divide',
            'add',
            'subtract',
            'average',
            'equal',
            'assertZero',
          ],
        },
        args: {
          required: true,
          array: true,
          type: 'string',
          description:
            'Inputs to the expression. Can be names of functionCalls or constants or specific values depending on the type of operation',
        },
      },
    },
  },
  [
    {
      functionCalls: [
        {
          name: 'result',
          signature:
            'function convertToAssets(uint256 shares) external view returns (uint256 assets)',
          address: '0xc8CF6D7991f15525488b2A83Df53468D682Ba4B0',
          inputParams: ['1000000000000000000'],
          network: 'ethereum',
        },
        {
          name: 'decimals',
          signature: 'function decimals() view returns (uint8)',
          address: '0xc8CF6D7991f15525488b2A83Df53468D682Ba4B0',
          inputParams: [],
          network: 'ethereum',
        },
      ],
      aptosCalls: [],
      constants: [
        {
          name: 'constant_example',
          value: '42',
        },
      ],
      operations: [
        {
          name: 'scaled_result',
          type: 'multiply',
          args: ['result', 'constant_example'],
        },
      ],
    },
    {
      functionCalls: [
        {
          name: 'priceLowHigh',
          address: '0x56f40A33e3a3fE2F1614bf82CBeb35987ac10194',
          network: 'ethereum',
          signature: 'function price() external view returns (uint192 low, uint192 high)',
          inputParams: [],
        },
      ],
      aptosCalls: [],
      constants: [],
      operations: [
        {
          name: 'priceLow',
          type: 'select',
          args: ['priceLowHigh', 'low'],
        },
      ],
    },
    {
      functionCalls: [],
      aptosCalls: [
        {
          name: 'result',
          signature:
            '0x6f8ca77dd0a4c65362f475adb1c26ae921b1d75aa6b70e53d0e340efd7d8bc80::staker::share_price',
          arguments: [],
          type: [],
          index: 1,
          networkType: 'mainnet',
        },
      ],
      constants: [],
      operations: [],
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: {
    Data: {
      [key: string]: string
    }
    Result: string | null
  }
  Settings: typeof config.settings
}

export type RequestParams = TypeFromDefinition<BaseEndpointTypes['Parameters']>
export type FunctionCall = RequestParams['functionCalls'][number]
export type AptosCall = RequestParams['aptosCalls'][number]
export type ConstantParam = RequestParams['constants'][number]
export type OperationParam = RequestParams['operations'][number]
export type OperationType = OperationParam['type']

export const endpoint = new AdapterEndpoint({
  name: 'calculated-multi-function',
  transport: calculatedMultiFunctionTransport,
  inputParameters,
  customInputValidation: (req): AdapterError | undefined => {
    const params: RequestParams = req.requestContext.data
    for (const fc of params.functionCalls) {
      const networkName = fc.network.toUpperCase()
      const networkEnvName = `${networkName}_RPC_URL`
      const chainIdEnvName = `${networkName}_CHAIN_ID`

      const rpcUrl = process.env[networkEnvName]
      const chainId = Number(process.env[chainIdEnvName])

      if (!rpcUrl || isNaN(chainId)) {
        throw new AdapterInputError({
          statusCode: 400,
          message: `Missing '${networkEnvName}' or '${chainIdEnvName}' environment variables.`,
        })
      }
    }
    for (const ac of params.aptosCalls) {
      doAptosCustomInputValidation(ac.networkType)
    }
    validateOperations(params)
    return
  },
})
