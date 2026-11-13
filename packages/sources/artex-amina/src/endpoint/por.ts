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

// ISO 6166 check digit. `validator` is not a dependency of this adapter, so the
// small standard checksum stays local; it replaces the format-only regex.
function toIsinDigit(char: string): string {
  const code = char.charCodeAt(0)
  if (code >= 48 && code <= 57) {
    return char
  }
  if (code >= 65 && code <= 90) {
    return String(code - 55)
  }
  return ''
}

function isIsin(value: string): boolean {
  if (value.length !== 12) {
    return false
  }
  const expanded = [...value.slice(0, 11)].map(toIsinDigit)
  if (expanded.some((digit) => digit.length === 0)) {
    return false
  }
  const digits = expanded.join('')
  const sum = [...digits].reverse().reduce((total, digit, index) => {
    const doubled = Number(digit) * (index % 2 === 0 ? 2 : 1)
    return total + (doubled > 9 ? doubled - 9 : doubled)
  }, 0)
  return (10 - (sum % 10)) % 10 === Number(value[11])
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
