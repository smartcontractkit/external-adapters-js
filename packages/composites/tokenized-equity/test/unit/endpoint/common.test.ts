import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { config } from '../../../src/config'
import { smoothedPriceInputValidation } from '../../../src/endpoint/common'

// Validation of the marketSessionOverride test hook: it is meaningless without
// market identity (gating is skipped without sessionMarket/sessionMarketType), so
// the request is rejected with 400 instead of silently ignoring the override.

describe('marketSessionOverride input validation', () => {
  const settings = config.settings

  const validate = (data: Record<string, unknown>) =>
    smoothedPriceInputValidation()({ requestContext: { data } } as never, settings)

  const baseData = {
    asset: '0x0',
    extendedStreamId: '0x000b6',
    smoother: 'ema',
    sessionMarket: 'nyse',
    sessionMarketType: '24/5',
    sessionBoundaries: [],
    sessionBoundariesTimeZone: 'UTC',
    decimals: 8,
  }

  it('accepts marketSessionOverride with sessionMarket and sessionMarketType', () => {
    expect(() => validate({ ...baseData, marketSessionOverride: 'REGULAR' })).not.toThrow()
  })

  it.each([['PRE_MARKET'], ['REGULAR'], ['POST_MARKET'], ['OVERNIGHT']])(
    'accepts the real session status %s',
    (override) => {
      expect(() => validate({ ...baseData, marketSessionOverride: override })).not.toThrow()
    },
  )

  it.each([['sessionMarket'], ['sessionMarketType']])(
    'rejects with 400 when marketSessionOverride is present but %s is missing',
    (missing) => {
      const data = { ...baseData, marketSessionOverride: 'REGULAR' } as Record<string, unknown>
      delete data[missing]

      expect(() => validate(data)).toThrow(
        expect.objectContaining({
          statusCode: 400,
          message: expect.stringMatching(
            /marketSessionOverride requires sessionMarket and sessionMarketType/,
          ),
        }),
      )
      expect(() => validate(data)).toThrow(AdapterInputError)
    },
  )

  it("rejects with 400 for a smoother 'none' feed without market identity", () => {
    expect(() =>
      validate({
        asset: '0x0',
        extendedStreamId: '0x000b6',
        smoother: 'none',
        sessionBoundaries: [],
        decimals: 8,
        marketSessionOverride: 'REGULAR',
      }),
    ).toThrow(
      expect.objectContaining({
        statusCode: 400,
        message: expect.stringMatching(
          /marketSessionOverride requires sessionMarket and sessionMarketType/,
        ),
      }),
    )
  })
})
