import { TwentyfourFiveMarketStatus } from '@chainlink/external-adapter-framework/adapter'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { calculateSecondsFromTransition } from '../../../src/lib/session/session'
import { processOvernightUpdate } from '../../../src/lib/smoother/overnightSmoother'
import { processUpdate } from '../../../src/lib/smoother/smoother'
import { getPrice } from '../../../src/lib/streams'
import { smoothedStreamPrice } from '../../../src/transport/smoothedPrice'

jest.mock('../../../src/lib/streams', () => ({ getPrice: jest.fn() }))
const mockGetPrice = getPrice as jest.MockedFunction<typeof getPrice>

jest.mock('../../../src/lib/smoother/smoother', () => ({ processUpdate: jest.fn() }))
const mockProcessUpdate = processUpdate as jest.MockedFunction<typeof processUpdate>

jest.mock('../../../src/lib/smoother/overnightSmoother', () => ({
  processOvernightUpdate: jest.fn(),
  // Real value, not mocked: smoothedStreamPrice reads this constant directly to decide
  // the warm-up window, so the mock module must still export it.
  WARMUP_MS: 60_000,
}))
const mockProcessOvernightUpdate = processOvernightUpdate as jest.MockedFunction<
  typeof processOvernightUpdate
>

jest.mock('../../../src/lib/session/session', () => ({ calculateSecondsFromTransition: jest.fn() }))
const mockCalculateSecondsFromTransition = calculateSecondsFromTransition as jest.MockedFunction<
  typeof calculateSecondsFromTransition
>

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
    decimals: 8,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    // Matches the previous behavior of the (now-mocked) real implementation for a
    // rawPrice of '1' with shouldSmooth=false, so every pre-existing test below —
    // none of which exercise the overnight EMA — keeps asserting the same values.
    mockProcessOvernightUpdate.mockReturnValue({ price: 1n, x: 0n, p: 0 })
  })

  describe('successful calculation', () => {
    it('price.decimals == target decimals', async () => {
      const streams = {
        regular: {
          mid: '1',
          lastSeenTimestampNs: '2',
          bid: '0.99',
          bidVolume: 100,
          ask: '1.01',
          askVolume: 100,
          lastTradedPrice: '1.00',
          marketStatus: 1,
          decimals: 18,
        },
        extended: {
          mid: '10',
          lastSeenTimestampNs: '20',
          bid: '9.9',
          bidVolume: 1000,
          ask: '10.1',
          askVolume: 1000,
          lastTradedPrice: '10.0',
          marketStatus: 2,
          decimals: 18,
        },
        overnight: {
          mid: '100',
          lastSeenTimestampNs: '200',
          bid: '99',
          bidVolume: 10000,
          ask: '101',
          askVolume: 10000,
          lastTradedPrice: '100',
          marketStatus: 3,
          decimals: 18,
        },
      }
      mockGetPrice.mockResolvedValue({
        price: '1',
        spread: 2n,
        decimals: 6,
        marketStatus: TwentyfourFiveMarketStatus.REGULAR,
        data: {
          regular: streams.regular,
          extended: streams.extended,
          overnight: streams.overnight,
        },
      })

      mockCalculateSecondsFromTransition.mockReturnValue(
        Promise.resolve({ value: 0, source: 'FALLBACK' }),
      )
      mockProcessUpdate.mockReturnValue({ price: 1n, x: 2n, p: 3n })

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
        sessionSource: 'FALLBACK',
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
      mockGetPrice.mockResolvedValue({
        price: '10',
        spread: 2n,
        decimals: 7,
        marketStatus: TwentyfourFiveMarketStatus.REGULAR,
        data: {
          regular: {} as any,
          extended: {} as any,
          overnight: {} as any,
        },
      })

      mockCalculateSecondsFromTransition.mockReturnValue(
        Promise.resolve({ value: 0, source: 'FALLBACK' }),
      )
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
      mockGetPrice.mockResolvedValue({
        price: '1',
        spread: 2n,
        decimals: 6,
        marketStatus: TwentyfourFiveMarketStatus.REGULAR,
        data: {
          regular: {} as any,
          extended: {} as any,
          overnight: {} as any,
        },
      })

      mockCalculateSecondsFromTransition.mockReturnValue(
        Promise.resolve({ value: 0, source: 'FALLBACK' }),
      )
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
        regular: {
          mid: '1',
          lastSeenTimestampNs: '2',
          bid: '0.99',
          bidVolume: 100,
          ask: '1.01',
          askVolume: 100,
          lastTradedPrice: '1.00',
          marketStatus: 1,
          decimals: 18,
        },
        extended: {
          mid: '10',
          lastSeenTimestampNs: '20',
          bid: '9.9',
          bidVolume: 1000,
          ask: '10.1',
          askVolume: 1000,
          lastTradedPrice: '10.0',
          marketStatus: 2,
          decimals: 18,
        },
        overnight: {
          mid: '100',
          lastSeenTimestampNs: '200',
          bid: '99',
          bidVolume: 10000,
          ask: '101',
          askVolume: 10000,
          lastTradedPrice: '100',
          marketStatus: 3,
          decimals: 18,
        },
      }
      mockGetPrice.mockResolvedValue({
        price: '1',
        spread: 2n,
        decimals: 6,
        marketStatus: TwentyfourFiveMarketStatus.REGULAR,
        data: {
          regular: streams.regular,
          extended: streams.extended,
          overnight: streams.overnight,
        },
      })

      mockCalculateSecondsFromTransition.mockReturnValue(Promise.resolve(undefined))

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
    })
  })

  describe('overnight EMA feed (processOvernightUpdate)', () => {
    // Gates when processOvernightUpdate is fed, so it's warm by the time it starts
    // driving the transition below — independent of when that actually happens.
    const mockPostMarket = (secondsFromTransition: number) => {
      mockGetPrice.mockResolvedValue({
        price: '1000',
        spread: 2n,
        decimals: 6,
        marketStatus: TwentyfourFiveMarketStatus.POST_MARKET,
        data: { regular: {} as any, extended: {} as any, overnight: {} as any },
      })
      mockCalculateSecondsFromTransition.mockResolvedValue({
        value: secondsFromTransition,
        source: 'TRADINGHOURS',
      })
    }

    beforeEach(() => {
      mockProcessUpdate.mockReturnValue({ price: 1234n, x: 2n, p: 3n })
      mockProcessOvernightUpdate.mockReturnValue({ price: 987n, x: 5n, p: 1000 })
    })

    it('feeds it once inside the warm-up window before the session starts', async () => {
      // The overnight EMA's hardcoded warm-up window is 60s.
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
      mockGetPrice.mockResolvedValue({
        price: '1000',
        spread: 2n,
        decimals: 6,
        marketStatus: TwentyfourFiveMarketStatus.PRE_MARKET,
        data: { regular: {} as any, extended: {} as any, overnight: {} as any },
      })
      mockCalculateSecondsFromTransition.mockResolvedValue({ value: -30, source: 'TRADINGHOURS' })

      await smoothedStreamPrice({ ...defaultParams, smoother: 'kalman', decimals: 6 })

      expect(mockProcessOvernightUpdate).toHaveBeenCalledWith('USDC', 1000n, false)
    })

    it('feeds it once per tick while actually overnight, not once per algorithm row', async () => {
      mockGetPrice.mockResolvedValue({
        price: '1000',
        spread: 2n,
        decimals: 6,
        marketStatus: TwentyfourFiveMarketStatus.OVERNIGHT,
        data: { regular: {} as any, extended: {} as any, overnight: {} as any },
      })
      mockCalculateSecondsFromTransition.mockResolvedValue({ value: 0, source: 'TRADINGHOURS' })

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
    // The Kalman/EMA transition itself is untouched — same filters, same raised-cosine
    // window. Only once the feed reports OVERNIGHT does it get fed the overnight EMA's
    // price instead of the true raw price; the wider warm-up window above only controls
    // when the overnight EMA starts accumulating state, not when it starts being
    // published — that still happens exactly at the boundary.
    beforeEach(() => {
      mockCalculateSecondsFromTransition.mockResolvedValue({ value: 0, source: 'TRADINGHOURS' })
      mockProcessUpdate.mockReturnValue({ price: 1234n, x: 2n, p: 3n })
      mockProcessOvernightUpdate.mockReturnValue({ price: 987n, x: 5n, p: 1000 })
    })

    it('feeds the overnight EMA price into the transition once actually overnight', async () => {
      mockGetPrice.mockResolvedValue({
        price: '1000',
        spread: 2n,
        decimals: 6,
        marketStatus: TwentyfourFiveMarketStatus.OVERNIGHT,
        data: { regular: {} as any, extended: {} as any, overnight: {} as any },
      })

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
        mockGetPrice.mockResolvedValue({
          price: '1000',
          spread: 2n,
          decimals: 6,
          marketStatus,
          data: { regular: {} as any, extended: {} as any, overnight: {} as any },
        })
        mockCalculateSecondsFromTransition.mockResolvedValue({ value: -30, source: 'TRADINGHOURS' })

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
      mockGetPrice.mockResolvedValue({
        price: '500000',
        spread: 2n,
        decimals: 6,
        marketStatus: TwentyfourFiveMarketStatus.OVERNIGHT,
        data: { regular: {} as any, extended: {} as any, overnight: {} as any },
      })
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
