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

// AMINA/OpenAPI Isin format: two letters, nine alphanumerics, one digit.
function isDigit(char: string): boolean {
  return char >= '0' && char <= '9'
}

function isUppercaseLetter(char: string): boolean {
  return char >= 'A' && char <= 'Z'
}

function isUppercaseLetterOrDigit(char: string): boolean {
  return isUppercaseLetter(char) || isDigit(char)
}

function isIsin(value: string): boolean {
  if (value.length !== 12) {
    return false
  }
  const chars = [...value]
  return (
    isUppercaseLetter(chars[0]) &&
    isUppercaseLetter(chars[1]) &&
    chars.slice(2, 11).every(isUppercaseLetterOrDigit) &&
    isDigit(chars[11])
  )
}

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
    const failures = [
      { field: 'portfolioNo', error: PORTFOLIO_NO_VALIDATOR.fn(portfolioNo) },
      { field: 'isin', error: isIsin(isin) ? undefined : 'must be a valid ISO 6166 ISIN' },
    ]
    const failure = failures.find((check) => check.error)
    return failure
      ? new AdapterInputError({
          statusCode: 400,
          message: `${failure.field}: ${failure.error}`,
        })
      : undefined
  },
})
