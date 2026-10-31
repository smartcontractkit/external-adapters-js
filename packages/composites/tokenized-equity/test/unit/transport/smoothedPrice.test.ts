import { TwentyfourFiveMarketStatus } from '@chainlink/external-adapter-framework/adapter'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { getSessionContext } from '../../../src/lib/session/session'
import { processOvernightUpdate } from '../../../src/lib/smoother/overnightSmoother'
import { processUpdate } from '../../../src/lib/smoother/smoother'
import { getStreams, selectStream, toPriceResult } from '../../../src/lib/streams'
import { smoothedStreamPrice } from '../../../src/transport/smoothedPrice'

jest.mock('../../../src/lib/streams', () => ({
  getStreams: jest.fn(),
  selectStream: jest.fn(),
  toPriceResult: jest.fn(),
  formatRejections: jest.fn((rejections: { stream: string; reason: string }[]) =>
    rejections.map((r) => `${r.stream}: ${r.reason}`).join(', '),
  ),
}))
const mockGetStreams = getStreams as jest.MockedFunction<typeof getStreams>
const mockSelectStream = selectStream as jest.MockedFunction<typeof selectStream>
const mockToPriceResult = toPriceResult as jest.MockedFunction<typeof toPriceResult>

jest.mock('../../../src/lib/smoother/smoother', () => ({ processUpdate: jest.fn() }))
const mockProcessUpdate = processUpdate as jest.MockedFunction<typeof processUpdate>

jest.mock('../../../src/lib/smoother/overnightSmoother', () => ({
  processOvernightUpdate: jest.fn(),
  WARMUP_MS: 60_000,
}))
const mockProcessOvernightUpdate = processOvernightUpdate as jest.MockedFunction<
  typeof processOvernightUpdate
>

jest.mock('../../../src/lib/session/session', () => ({ getSessionContext: jest.fn() }))
const mockGetSessionContext = getSessionContext as jest.MockedFunction<typeof getSessionContext>

const session = (
  secondsFromTransition = 0,
  source: 'TRADINGHOURS' | 'FALLBACK' = 'TRADINGHOURS',
) => ({
  secondsFromTransition,
  source,
  events: [{ status: TwentyfourFiveMarketStatus.PRE_MARKET, startMs: 1_700_000_000_000 }],
  expectedStatus: TwentyfourFiveMarketStatus.PRE_MARKET,
  weekend: '520-020:UTC',
})

const price = (overrides: Partial<ReturnType<typeof toPriceResult>> = {}) => ({
  price: '1',
  spread: 2n,
  decimals: 6,
  marketStatus: TwentyfourFiveMarketStatus.REGULAR,
  lastSeenTimestampNs: '0',
  data: {},
  ...overrides,
})

describe('smoothedStreamPrice', () => {
  const defaultParams = {
    asset: 'USDC',
    regularStreamId: 'regular-stream-id',
    extendedStreamId: 'extended-stream-id',
    overnightStreamId: 'overnight-stream-id',
    overnightStreamMaxAgeInSeconds: 100,
    url: 'https://api.example.com',
    tradingHoursUrl: 'https://trading-hours.example.com',
    requester: {} as Requester,
    sessionBoundaries: ['09:00', '17:00'],
    sessionBoundariesTimeZone: 'America/New_York',
    sessionMarket: 'nyse',
    sessionMarketType: '24/5',
    sessionWeekend: '520-020:America/New_York',
    decimals: 8,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockGetStreams.mockResolvedValue({ errors: {} })
    mockSelectStream.mockReturnValue({ report: {} as never, rejections: [] })
    mockToPriceResult.mockReturnValue(price())
    mockGetSessionContext.mockResolvedValue(session())
    mockProcessOvernightUpdate.mockReturnValue({ price: 1n, x: 0n, p: 0 })
    mockProcessUpdate.mockReturnValue({ price: 1n, x: 2n, p: 3n })
  })

  describe('successful calculation', () => {
    it('price.decimals == target decimals', async () => {
      const streams = {
        regular: { mid: '1' },
        extended: { mid: '10' },
        overnight: { mid: '100' },
      }
      mockGetStreams.mockResolvedValue(streams as never)
      mockToPriceResult.mockReturnValue(price({ data: streams as never }))

      const result = (
        await smoothedStreamPrice({
          ...defaultParams,
          smoother: 'kalman',
          decimals: 6,
        })
      ).map((r) => ({
        ...r,
        result: r.result.toString(),
      }))

      const expectedResult = {
        result: '1',
        rawPrice: '1',
        decimals: 6,
        stream: streams,
        smoother: {
          price: '1',
          x: '2',
          p: '3',
          secondsFromTransition: 0,
        },
        sessionSource: 'TRADINGHOURS',
      }
      expect(result[0]).toStrictEqual({
        ...expectedResult,
        smoother: {
          ...expectedResult.smoother,
          smoother: 'ema',
        },
      })
      expect(result[1]).toStrictEqual({
        ...expectedResult,
        smoother: {
          ...expectedResult.smoother,
          smoother: 'kalman',
        },
      })
    })

    it('price.decimals > target decimals', async () => {
      mockToPriceResult.mockReturnValue(price({ price: '10', decimals: 7 }))
      mockProcessUpdate.mockReturnValue({ price: 10n, x: 1n, p: 2n })

      const result = await smoothedStreamPrice({
        ...defaultParams,
        smoother: 'kalman',
        decimals: 6,
      })

      expect(result[0].result.toString()).toEqual('1')
      expect(result[0].decimals).toEqual(6)
    })

    it('price.decimals < target decimals', async () => {
      mockToPriceResult.mockReturnValue(price({ price: '1', decimals: 6 }))
      mockProcessUpdate.mockReturnValue({ price: 1n, x: 2n, p: 3n })

      const result = await smoothedStreamPrice({
        ...defaultParams,
        smoother: 'kalman',
        decimals: 7,
      })

      expect(result[0].result.toString()).toEqual('10')
      expect(result[0].decimals).toEqual(7)
    })

    it('no smoother', async () => {
      const streams = {
        regular: { mid: '1' },
        extended: { mid: '10' },
        overnight: { mid: '100' },
      }
      mockGetStreams.mockResolvedValue(streams as never)
      mockGetSessionContext.mockResolvedValue(undefined)
      mockToPriceResult.mockReturnValue(price({ data: streams as never }))

      const result = (
        await smoothedStreamPrice({
          ...defaultParams,
          smoother: 'none',
          decimals: 6,
        })
      ).map((r) => ({
        ...r,
        result: r.result.toString(),
      }))

      expect(result.length).toEqual(1)
      expect(result[0]).toStrictEqual({
        result: '1',
        rawPrice: '1',
        decimals: 6,
        stream: streams,
        smoother: {
          price: '1',
          x: '0',
          p: '0',
          smoother: 'none',
          secondsFromTransition: undefined,
        },
        sessionSource: undefined,
      })
      // No schedule means no gate.
      expect(mockSelectStream).toHaveBeenCalledWith(streams, undefined)
    })

    it('passes the session weekend window through', async () => {
      await smoothedStreamPrice({ ...defaultParams, smoother: 'kalman', decimals: 6 })

      expect(mockGetSessionContext).toHaveBeenCalledWith(
        defaultParams.tradingHoursUrl,
        defaultParams.requester,
        defaultParams.sessionBoundaries,
        defaultParams.sessionBoundariesTimeZone,
        defaultParams.sessionMarket,
        defaultParams.sessionMarketType,
        defaultParams.sessionWeekend,
      )
    })

    it('adds sessionGate details to the output', async () => {
      mockSelectStream.mockReturnValue({
        report: {} as never,
        rejections: [],
        gate: {
          eligible: true,
          reportTimestampMs: Date.parse('2024-01-15T09:30:12Z'),
          sessionStartMs: Date.parse('2024-01-15T09:30:00Z'),
          expectedStatus: TwentyfourFiveMarketStatus.REGULAR,
        },
      })

      const result = await smoothedStreamPrice({
        ...defaultParams,
        smoother: 'kalman',
        decimals: 6,
      })

      expect(result[0].sessionGate).toEqual({
        expectedStatus: 'REGULAR',
        sessionStart: '2024-01-15T09:30:00.000Z',
        reportTimestamp: '2024-01-15T09:30:12.000Z',
        source: 'TRADINGHOURS',
      })
    })

    it('throws 503 when no stream is eligible', async () => {
      mockSelectStream.mockReturnValue({
        rejections: [
          { stream: 'regular', reason: 'report is for PRE_MARKET but REGULAR is expected' },
          { stream: 'extended', reason: 'report is for PRE_MARKET but REGULAR is expected' },
        ],
      })

      const error = await smoothedStreamPrice({
        ...defaultParams,
        smoother: 'kalman',
        decimals: 6,
      }).catch((e) => e)

      expect(error).toBeInstanceOf(AdapterError)
      expect(error.statusCode).toBe(503)
      expect(error.message).toContain('No eligible session report')
      expect(error.message).toContain('report is for PRE_MARKET but REGULAR is expected')
      expect(mockToPriceResult).not.toHaveBeenCalled()
    })

    it('does not apply a gate when the schedule is empty', async () => {
      mockGetSessionContext.mockResolvedValue({ ...session(), events: [] })

      await smoothedStreamPrice({ ...defaultParams, smoother: 'kalman', decimals: 6 })

      expect(mockSelectStream).toHaveBeenCalledWith(expect.anything(), undefined)
    })
  })

  describe('overnight EMA feed (processOvernightUpdate)', () => {
    const mockPostMarket = (secondsFromTransition: number) => {
      mockToPriceResult.mockReturnValue(
        price({ price: '1000', marketStatus: TwentyfourFiveMarketStatus.POST_MARKET }),
      )
      mockGetSessionContext.mockResolvedValue(session(secondsFromTransition))
    }

    beforeEach(() => {
      mockProcessUpdate.mockReturnValue({ price: 1234n, x: 2n, p: 3n })
      mockProcessOvernightUpdate.mockReturnValue({ price: 987n, x: 5n, p: 1000 })
    })

    it('feeds it once inside the warm-up window before the session starts', async () => {
      mockPostMarket(-30)

      await smoothedStreamPrice({ ...defaultParams, smoother: 'kalman', decimals: 6 })

      expect(mockProcessOvernightUpdate).toHaveBeenCalledWith('USDC', 1000n, true)
    })

    it('feeds it exactly at the edge of the warm-up window', async () => {
      mockPostMarket(-60)

      await smoothedStreamPrice({ ...defaultParams, smoother: 'kalman', decimals: 6 })

      expect(mockProcessOvernightUpdate).toHaveBeenCalledWith('USDC', 1000n, true)
    })

    it('does not feed it outside the warm-up window', async () => {
      mockPostMarket(-61)

      await smoothedStreamPrice({ ...defaultParams, smoother: 'kalman', decimals: 6 })

      expect(mockProcessOvernightUpdate).toHaveBeenCalledWith('USDC', 1000n, false)
    })

    it('does not warm up outside POST_MARKET, even within 60s of a boundary', async () => {
      mockToPriceResult.mockReturnValue(
        price({ price: '1000', marketStatus: TwentyfourFiveMarketStatus.PRE_MARKET }),
      )
      mockGetSessionContext.mockResolvedValue(session(-30))

      await smoothedStreamPrice({ ...defaultParams, smoother: 'kalman', decimals: 6 })

      expect(mockProcessOvernightUpdate).toHaveBeenCalledWith('USDC', 1000n, false)
    })

    it('feeds it once per tick while actually overnight, not once per algorithm row', async () => {
      mockToPriceResult.mockReturnValue(
        price({ price: '1000', marketStatus: TwentyfourFiveMarketStatus.OVERNIGHT }),
      )
      mockGetSessionContext.mockResolvedValue(session(0))

      const result = await smoothedStreamPrice({
        ...defaultParams,
        smoother: 'kalman',
        decimals: 6,
      })

      expect(result).toHaveLength(2) // 'ema' and 'kalman' rows
      expect(mockProcessOvernightUpdate).toHaveBeenCalledTimes(1)
      expect(mockProcessOvernightUpdate).toHaveBeenCalledWith('USDC', 1000n, true)
    })
  })

  describe('transition input (processUpdate)', () => {
    beforeEach(() => {
      mockGetSessionContext.mockResolvedValue(session(0))
      mockProcessUpdate.mockReturnValue({ price: 1234n, x: 2n, p: 3n })
      mockProcessOvernightUpdate.mockReturnValue({ price: 987n, x: 5n, p: 1000 })
    })

    it('feeds the overnight EMA price into the transition once actually overnight', async () => {
      mockToPriceResult.mockReturnValue(
        price({ price: '1000', marketStatus: TwentyfourFiveMarketStatus.OVERNIGHT }),
      )

      await smoothedStreamPrice({ ...defaultParams, smoother: 'kalman', decimals: 6 })

      // Filter is always fed the true raw price (1000n); only the target it decays
      // towards away from the boundary becomes the overnight EMA's price (987n).
      expect(mockProcessUpdate).toHaveBeenCalledWith('kalman', 'USDC', 1000n, 987n, 2n, 0)
    })

    it.each([
      ['REGULAR', TwentyfourFiveMarketStatus.REGULAR],
      ['PRE_MARKET', TwentyfourFiveMarketStatus.PRE_MARKET],
      ['POST_MARKET', TwentyfourFiveMarketStatus.POST_MARKET],
    ])(
      'feeds the true raw price into the transition during %s, even inside the warm-up window',
      async (_name, marketStatus) => {
        mockToPriceResult.mockReturnValue(price({ price: '1000', marketStatus }))
        mockGetSessionContext.mockResolvedValue(session(-30))

        const result = await smoothedStreamPrice({
          ...defaultParams,
          smoother: 'kalman',
          decimals: 6,
        })

        // Not overnight: target is the raw price too, same as rawPrice.
        expect(mockProcessUpdate).toHaveBeenCalledWith('kalman', 'USDC', 1000n, 1000n, 2n, -30)
        expect(result[0].result).toEqual(1234n)
      },
    )

    it('pipes the unscaled overnight-EMA price into the transition, not the target-decimals result', async () => {
      // price.decimals (6) and param.decimals (8) deliberately differ here, unlike every
      // other test in this file: with matching decimals, feeding the already
      // target-decimals-scaled result (a 100x-inflated value in this case) into the
      // transition instead of the raw `overnight.price` would be indistinguishable from
      // correct, since scaling by 1 twice is still 1.
      mockToPriceResult.mockReturnValue(
        price({
          price: '500000',
          decimals: 6,
          marketStatus: TwentyfourFiveMarketStatus.OVERNIGHT,
        }),
      )
      mockProcessOvernightUpdate.mockReturnValue({ price: 500_000n, x: 0n, p: 0 })
      // Simulates a weight-0 passthrough of whatever it was fed, same as the real
      // transition would do well past the boundary — isolates this test to the
      // decimals scaling, not the Kalman/EMA blending math (covered elsewhere).
      mockProcessUpdate.mockReturnValue({ price: 500_000n, x: 0n, p: 0n })

      const result = await smoothedStreamPrice({
        ...defaultParams,
        smoother: 'kalman',
        decimals: 8,
      })

      expect(mockProcessUpdate).toHaveBeenCalledWith('kalman', 'USDC', 500_000n, 500_000n, 2n, 0)
      // 500_000 * 10^8 / 10^6 = 50_000_000, scaled exactly once.
      expect(result[0].result).toEqual(50_000_000n)
    })
  })
})
