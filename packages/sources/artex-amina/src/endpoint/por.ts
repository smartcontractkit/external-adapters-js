import {
  PoRProviderEndpoint,
  PoRProviderResponse,
} from '@chainlink/external-adapter-framework/adapter/por'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { validator as frameworkValidator } from '@chainlink/external-adapter-framework/validation/utils'
import type { config } from '../config'
import { porTransport } from '../transport/por'

export const inputParameters = new InputParameters(
  {
    portfolioNo: {
      required: true,
      type: 'number',
      description: 'portfolio number',
    },
    isin: {
      required: true,
      type: 'string',
      description: 'ISIN',
    },
  },
  [
    {
      portfolioNo: 157769305,
      isin: 'US0378331005',
    },
  ],
)

const PORTFOLIO_NO_VALIDATOR = frameworkValidator.integer({
  min: 100_000_000,
  max: 999_999_999,
})

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: PoRProviderResponse & {
    Data: {
      aum: number
      ripcordAsInt: number
      navPerShare: number
      navDate: number
      nativeFee: number
      linkFee: number
    }
  }
  Settings: typeof config.settings
}

export const endpoint = new PoRProviderEndpoint({
  name: 'por',
  transport: porTransport,
  inputParameters,
  customInputValidation: (request): AdapterInputError | undefined => {
    const { portfolioNo } = request.requestContext.data
    const error = PORTFOLIO_NO_VALIDATOR.fn(portfolioNo)
    return error
      ? new AdapterInputError({
          statusCode: 400,
          message: `portfolioNo: ${error}`,
        })
      : undefined
  },
})
