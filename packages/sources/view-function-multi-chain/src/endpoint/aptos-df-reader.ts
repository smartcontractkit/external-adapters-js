import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { AdapterRequest } from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { config } from '../config'
import {
  aptosTransport as aptosDfReaderTransport,
  HttpTransportTypes,
} from '../transport/aptos-df-reader'

export const inputParameters = new InputParameters({
  signature: {
    type: 'string',
    aliases: ['function'],
    required: true,
    description: 'Function signature. Format: {address}::{module name}::{function name}',
  },
  networkType: {
    description: 'testnet or mainnet',
    type: 'string',
    options: ['testnet', 'mainnet'],
    default: 'mainnet',
  },
  feedId: {
    description: 'feedId to parse',
    type: 'string',
    required: true,
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

export const endpoint = new AdapterEndpoint<HttpTransportTypes>({
  name: 'aptos-df-reader',
  transport: aptosDfReaderTransport,
  inputParameters,
  customInputValidation: (
    req: AdapterRequest<typeof inputParameters.validated>,
    adapterSettings,
  ): AdapterInputError | undefined => {
    const rpcUrl =
      req.requestContext.data.networkType == 'testnet' ? 'APTOS_TESTNET_URL' : 'APTOS_URL'
    if (!adapterSettings[rpcUrl]) {
      throw new AdapterInputError({
        statusCode: 400,
        message: `Error: missing environment variable ${rpcUrl}`,
      })
    }
    return
  },
})
