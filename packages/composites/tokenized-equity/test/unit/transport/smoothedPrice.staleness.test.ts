import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { getSessionSchedule } from '../../../src/lib/session/session'
import { processOvernightUpdate } from '../../../src/lib/smoother/overnightSmoother'
import { processUpdate } from '../../../src/lib/smoother/smoother'
import { getPrice } from '../../../src/lib/streams'
import { smoothedStreamPrice } from '../../../src/transport/smoothedPrice'

// A stale-stream rejection from getPrice must propagate and must never reach the
// smoothers — stale ticks must not poison kalman/EMA/overnight-EMA state.

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

jest.mock('../../../src/lib/session/session', () => ({ getSessionSchedule: jest.fn() }))
const mockGetSessionSchedule = getSessionSchedule as jest.MockedFunction<typeof getSessionSchedule>

describe('smoothedStreamPrice staleness rejection', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetSessionSchedule.mockResolvedValue({
      secondsFromTransition: { value: -100, source: 'FALLBACK' },
    })
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
