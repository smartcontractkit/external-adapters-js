import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import {
  PoRBalanceEndpoint,
  porBalanceEndpointInputParametersDefinition,
  PoRBalanceResponse,
} from '@chainlink/external-adapter-framework/adapter/por'
import { config } from '../config'
import { balanceTransport } from '../transport/balance'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'

export const inputParameters = new InputParameters(
  {
    ...porBalanceEndpointInputParametersDefinition,
    stateId: {
      required: false,
      type: 'string',
      description: 'The beacon chain state ID to query',
      default: 'finalized',
    },
    validatorStatus: {
      required: false,
      array: true,
      type: 'string',
      description: 'A filter to apply validators by their status',
    },
    searchLimboValidators: {
      type: 'boolean',
      description:
        'Flag to determine if deposit events need to be searched for limbo validators. Only set to true if using an archive node.',
      default: false,
      required: false,
    },
  },
  [
    {
      addresses: [
        {
          address:
            '0x8bdb63ea991f42129d6defa8d3cc5926108232c89824ad50d57f49a0310de73e81e491eae6587bd1465fa5fd8e4dee21',
        },
        {
          address:
            '0xb672b5976879c6423ad484ba4fa0e76069684eed8e2a8081f6730907f3618d43828d1b399d2fd22d7961824594f73462',
        },
      ],
      stateId: 'finalized',
      searchLimboValidators: false,
      validatorStatus: [],
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: PoRBalanceResponse
  Settings: typeof config.settings
}

export const endpoint = new PoRBalanceEndpoint({
  name: 'balance',
  transport: balanceTransport,
  inputParameters,
  customInputValidation: (request, adapterSettings): AdapterInputError | undefined => {
    if (
      request.requestContext.data.searchLimboValidators &&
      !adapterSettings.ETH_EXECUTION_RPC_URL
    ) {
      throw new AdapterInputError({
        message: `ETH_EXECUTION_RPC_URL env var must be set to perform limbo validator search. Please use an archive node.`,
      })
    }
    if (request.requestContext.data.addresses.length === 0) {
      throw new AdapterInputError({
        statusCode: 400,
        message: `Input, at 'addresses' or 'result' path, must be a non-empty array.`,
      })
    }

    return
  },
})
