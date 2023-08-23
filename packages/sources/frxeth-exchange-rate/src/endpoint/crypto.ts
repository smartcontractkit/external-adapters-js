import {
  AdapterEndpoint,
  CustomInputValidator,
} from '@chainlink/external-adapter-framework/adapter'
import { exchangeRateTransport } from '../transport/exchange-rate'
import overrides from '../config/overrides.json'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { config } from '../config'

export const inputParameters = new InputParameters({
  priceType: {
    description: "The price type to fetch, either 'HIGH' or 'LOW'.",
    required: true,
    type: 'string',
  },
})

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: SingleNumberResultResponse
  Settings: typeof config.settings
}

const customInputValidation: CustomInputValidator<BaseEndpointTypes> = (
  request,
): AdapterInputError | undefined => {
  const priceType = request.requestContext.data.priceType
  if (priceType.toUpperCase() != 'HIGH' && priceType.toUpperCase() != 'LOW') {
    throw new AdapterInputError({
      message: `priceType input parameter must be one of 'HIGH' or 'LOW'.`,
    })
  }

  return
}

export const endpoint = new AdapterEndpoint({
  name: 'crypto',
  aliases: [],
  transport: exchangeRateTransport,
  inputParameters: inputParameters,
  overrides: overrides['frxeth-exchange-rate'],
  customInputValidation,
})
