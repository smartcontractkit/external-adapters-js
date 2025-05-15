import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'

export type ErrorObj = {
  message: string
  error_code: string
  vm_error_code: number
}

export type RequestObj = {
  function: string
  type_arguments: string[]
  arguments: string[]
}

export const aptosBaseInputParameters = {
  signature: {
    type: 'string',
    aliases: ['function'],
    required: true,
    description: 'Function signature. Format: {address}::{module name}::{function name}',
  },
  arguments: {
    array: true,
    description: 'Arguments of the function',
    type: 'string',
  },
  type: {
    array: true,
    description: 'Type arguments of the function',
    type: 'string',
  },
  index: {
    description: 'Which item in the function output array to return',
    type: 'number',
    default: 0,
  },
  networkType: {
    description: 'testnet or mainnet',
    type: 'string',
    options: ['testnet', 'mainnet'],
    default: 'mainnet',
  },
} as const

export const getAptosRpcUrl = (networkType: string): string => {
  const rpcUrlEnvVar = networkType == 'testnet' ? 'APTOS_TESTNET_URL' : 'APTOS_URL'
  const rpcUrl = process.env[rpcUrlEnvVar]
  if (!rpcUrl) {
    throw new AdapterInputError({
      statusCode: 400,
      message: `Error: missing environment variable ${rpcUrlEnvVar}`,
    })
  }
  return rpcUrl
}

export const doAptosCustomInputValidation = (
  networkType: string,
): AdapterInputError | undefined => {
  getAptosRpcUrl(networkType)
  return
}

export const doPrepareRequests = (
  networkType: string,
  signature: string,
  type: string[],
  args: string[],
) => {
  return {
    request: {
      baseURL: getAptosRpcUrl(networkType),
      url: '/view',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        function: signature,
        type_arguments: type ?? [],
        arguments: args ?? [],
      },
    },
  }
}
