import {
  PoRProviderEndpoint,
  PoRProviderResponse,
} from '@chainlink/external-adapter-framework/adapter/por'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
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

const ISIN_PATTERN = /^[A-Z]{2}[A-Z0-9]{9}[0-9]$/

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
    const { portfolioNo, isin } = request.requestContext.data
    if (!Number.isInteger(portfolioNo) || portfolioNo < 100_000_000 || portfolioNo > 999_999_999) {
      return new AdapterInputError({
        statusCode: 400,
        message: 'portfolioNo must be an integer between 100000000 and 999999999',
      })
    }
    if (!ISIN_PATTERN.test(isin)) {
      return new AdapterInputError({
        statusCode: 400,
        message: 'isin must match ^[A-Z]{2}[A-Z0-9]{9}[0-9]$',
      })
    }
    return undefined
  },
})
