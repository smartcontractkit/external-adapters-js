import {
  PoRBalanceEndpoint,
  porBalanceEndpointInputParametersDefinition,
  PoRBalanceResponse,
} from '@chainlink/external-adapter-framework/adapter/por'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { transport } from '../transport/balance'
import { AdapterRequest } from '@chainlink/external-adapter-framework/util'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'

export const inputParameters = new InputParameters(porBalanceEndpointInputParametersDefinition, [
  {
    addresses: [
      {
        address: '13nogjgyJcGQduHt8RtZiKKbt7Uy6py9hv1WMDZWueEcsHdh',
      },
      {
        address: '126rjyDQEJm6V6YPDcN85hJDYraqB6hL9bFsvWLDnM8rLc3J',
      },
    ],
  },
])

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Settings: typeof config.settings
  Response: PoRBalanceResponse
}

export const balanceEndpoint = new PoRBalanceEndpoint({
  name: 'balance',
  transport,
  inputParameters,
  customInputValidation: (
    req: AdapterRequest<typeof inputParameters.validated>,
  ): AdapterInputError | undefined => {
    if (req.requestContext.data.addresses.length === 0) {
      throw new AdapterInputError({
        statusCode: 400,
        message: `Input, at 'addresses' or 'result' path, must be a non-empty array.`,
      })
    }
    return
  },
})
