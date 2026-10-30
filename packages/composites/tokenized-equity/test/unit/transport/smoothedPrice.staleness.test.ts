import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { calculateSecondsFromTransition } from '../../../src/lib/session/session'
import { processOvernightUpdate } from '../../../src/lib/smoother/overnightSmoother'
import { processUpdate } from '../../../src/lib/smoother/smoother'
import { getPrice } from '../../../src/lib/streams'
import { smoothedStreamPrice } from '../../../src/transport/smoothedPrice'

// PR1 checkpoint 1 (DF-28181): a stale-stream rejection from getPrice must propagate and must
// never reach the smoothers — stale ticks must not poison kalman/EMA/overnight-EMA state.
// This passes on current code too (any getPrice rejection propagates); it pins the behavior so
// checkpoint 2's new rejection path cannot regress it.

jest.mock('../../../src/lib/streams', () => ({ getPrice: jest.fn() }))
const mockGetPrice = getPrice as jest.MockedFunction<typeof getPrice>

jest.mock('../../../src/lib/smoother/smoother', () => ({ processUpdate: jest.fn() }))
const mockProcessUpdate = processUpdate as jest.MockedFunction<typeof processUpdate>

jest.mock('../../../src/lib/smoother/overnightSmoother', () => ({
  processOvernightUpdate: jest.fn(),
  WARMUP_MS: 60_000,
}))
const mockProcessOvernightUpdate = processOvernightUpdate as jest.MockedFunction<
  typeof processOvernightUpdate
>

jest.mock('../../../src/lib/session/session', () => ({ calculateSecondsFromTransition: jest.fn() }))
const mockCalculateSecondsFromTransition = calculateSecondsFromTransition as jest.MockedFunction<
  typeof calculateSecondsFromTransition
>

describe('smoothedStreamPrice staleness rejection', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCalculateSecondsFromTransition.mockResolvedValue({ value: -100, source: 'FALLBACK' })
    mockGetPrice.mockRejectedValue(
      new AdapterError({
        statusCode: 503,
        message: 'Market is not open: regular STALE(age=4000s>30s)',
      }),
    )
  })

  it('rejects without updating any smoother state', async () => {
    await expect(
      smoothedStreamPrice({
        asset: 'AAPL',
        regularStreamId: 'regular-stream-id',
        url: 'https://api.example.com',
        tradingHoursUrl: 'https://trading-hours.example.com',
        requester: {} as Requester,
        sessionBoundaries: ['09:00', '17:00'],
        sessionBoundariesTimeZone: 'America/New_York',
        sessionMarket: 'nyse',
        sessionMarketType: '24/5',
        smoother: 'kalman',
        decimals: 8,
      }),
    ).rejects.toThrow(
      expect.objectContaining({
        statusCode: 503,
        message: expect.stringMatching(/STALE/),
      }),
    )

    expect(mockProcessUpdate).not.toHaveBeenCalled()
    expect(mockProcessOvernightUpdate).not.toHaveBeenCalled()
  })
})
