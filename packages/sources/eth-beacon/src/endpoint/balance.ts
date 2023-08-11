import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import {
  PoRBalanceEndpoint,
  porBalanceEndpointInputParametersDefinition,
  PoRBalanceResponse,
} from '@chainlink/external-adapter-framework/adapter/por'
import { config } from '../config'
import { balanceTransport } from '../transport/balance'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'

export const inputParameters = new InputParameters({
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
})

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
    return
  },
})
