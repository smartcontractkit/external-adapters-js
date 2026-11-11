import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { endpoint } from '../../src/endpoint/por'

const PORTFOLIO_NO = 157769305
const ISIN = 'US0378331005'

function validate(portfolioNo: number, isin: string) {
  if (!endpoint.customInputValidation) {
    throw new Error('por endpoint must define custom input validation')
  }
  return endpoint.customInputValidation(
    { requestContext: { data: { portfolioNo, isin } } } as never,
    {} as never,
  )
}

describe('por input validation', () => {
  const invalidInputs: Array<[string, number, string, RegExp]> = [
    ['a portfolio below the minimum', 99_999_999, ISIN, /portfolioNo/],
    ['a portfolio above the maximum', 1_000_000_000, ISIN, /portfolioNo/],
    ['a non-integer portfolio', PORTFOLIO_NO + 0.5, ISIN, /portfolioNo/],
    ['a lowercase ISIN', PORTFOLIO_NO, 'us0378331005', /isin/],
  ]

  it.each(invalidInputs)('rejects %s with a 400', (_, portfolioNo, isin, message) => {
    const error = validate(portfolioNo, isin)

    expect(error).toBeInstanceOf(AdapterInputError)
    expect(error?.statusCode).toBe(400)
    expect(error?.message).toMatch(message)
  })

  it.each([100_000_000, 999_999_999])('accepts portfolio %i at the boundary', (portfolioNo) => {
    expect(validate(portfolioNo, ISIN)).toBeUndefined()
  })
})
