import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import {
  AdapterError,
  AdapterInputError,
} from '@chainlink/external-adapter-framework/validation/error'
import { config } from '../config'
import { calculatedMultiFunctionTransport } from '../transport/calculated-multi-function'

export const inputParameters = new InputParameters(
  {
    functionCalls: {
      description: 'Array view-function calls to be made to the blockchain',
      required: true,
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

export const endpoint = new AdapterEndpoint({
  name: 'calculated-multi-function',
  transport: calculatedMultiFunctionTransport,
  inputParameters,
  customInputValidation: (req): AdapterError | undefined => {
    const functionCalls = req.requestContext.data.functionCalls
    for (const fc of functionCalls) {
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
    return
  },
})
