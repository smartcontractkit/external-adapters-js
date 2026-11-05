import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'

// Fund ids are canonical lowercase slugs and are interpolated into the
// provider URL path. Reject anything outside `[a-z0-9][a-z0-9_-]*`.
const FUND_ID_PATTERN = /^[a-z0-9][a-z0-9_-]*$/

export const validateFundId = (fundId: string): AdapterInputError | undefined => {
  if (!FUND_ID_PATTERN.test(fundId)) {
    return new AdapterInputError({
      statusCode: 400,
      message: `Invalid fundId: ${fundId}`,
    })
  }
  return undefined
}
