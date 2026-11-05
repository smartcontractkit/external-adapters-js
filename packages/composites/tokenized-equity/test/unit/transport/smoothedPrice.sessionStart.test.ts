import { BaseEndpointTypes } from '@chainlink/data-engine-adapter/src/endpoint/deutscheBoerseV11'
import { TwentyfourFiveMarketStatus } from '@chainlink/external-adapter-framework/adapter'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { getSessionSchedule } from '../../../src/lib/session/session'
import { processOvernightUpdate } from '../../../src/lib/smoother/overnightSmoother'
import { processUpdate } from '../../../src/lib/smoother/smoother'
import { getPrice } from '../../../src/lib/streams'
import { smoothedStreamPrice } from '../../../src/transport/smoothedPrice'

// Session-start gating is per-request. When the request carries no market identity
// (sessionMarket/sessionMarketType) — the smoother:'none' feeds' steady state — the
// check is skipped entirely even with DS_SESSION_START_GATING_ENABLED=true:
// smoothedStreamPrice must call getPrice with no SessionStartGating object at all, so
// the request passes through exactly as if gating were disabled (no fail-closed 503,
// no fallback consultation).

type DataEngineResponse = BaseEndpointTypes['Response']['Data']
const emptyStreamData = {} as unknown as DataEngineResponse

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

// sessionStartGating is getPrice's 8th (last) positional argument.
const gatingArg = () => mockGetPrice.mock.calls[0][7]

describe('smoothedStreamPrice session-start gating skip (no market identity)', () => {
  const baseParams = {
    asset: 'FLHYon',
    extendedStreamId: 'extended-stream-id',
    url: 'https://api.example.com',
    tradingHoursUrl: 'https://trading-hours.example.com',
    requester: {} as Requester,
    sessionBoundaries: [] as string[],
    smoother: 'none' as const,
    decimals: 8,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockGetPrice.mockResolvedValue({
      price: '1',
      spread: 2n,
      decimals: 6,
      marketStatus: TwentyfourFiveMarketStatus.PRE_MARKET,
      data: { regular: emptyStreamData, extended: emptyStreamData, overnight: emptyStreamData },
    })
    // With no session params the real getSessionSchedule makes no tradinghours fetch
    // and returns an empty object; even if it somehow returned transitions, the skip
    // must keep them from reaching getPrice.
    mockGetSessionSchedule.mockResolvedValue({})
    mockProcessUpdate.mockReturnValue({ price: 1n, x: 0n, p: 0n })
    mockProcessOvernightUpdate.mockReturnValue({ price: 1n, x: 0n, p: 0 })
  })

  it('passes no gating to getPrice when both session params are absent, even with the flag on', async () => {
    await smoothedStreamPrice({
      ...baseParams,
      sessionStartGatingEnabled: true,
    })

    expect(mockGetPrice).toHaveBeenCalledTimes(1)
    expect(gatingArg()).toBeUndefined()
  })

  it.each([['sessionMarket'], ['sessionMarketType']])(
    'passes no gating to getPrice when only %s is present',
    async (param) => {
      await smoothedStreamPrice({
        ...baseParams,
        sessionStartGatingEnabled: true,
        [param]: param === 'sessionMarket' ? 'nyse' : '24/5',
      })

      expect(gatingArg()).toBeUndefined()
    },
  )

  it('passes gating to getPrice when both session params are present and the flag is on', async () => {
    const transitions = [{ status: TwentyfourFiveMarketStatus.PRE_MARKET, timeMs: 1000 }]
    const fallbackTransitions = [{ status: TwentyfourFiveMarketStatus.PRE_MARKET, timeMs: 500 }]
    mockGetSessionSchedule.mockResolvedValue({ transitions, fallbackTransitions })

    await smoothedStreamPrice({
      ...baseParams,
      sessionStartGatingEnabled: true,
      sessionMarket: 'nyse',
      sessionMarketType: '24/5',
    })

    expect(gatingArg()).toEqual({ transitions, fallbackTransitions })
  })

  it('passes no gating to getPrice when the flag is off, even with both session params', async () => {
    const transitions = [{ status: TwentyfourFiveMarketStatus.PRE_MARKET, timeMs: 1000 }]
    mockGetSessionSchedule.mockResolvedValue({ transitions })

    await smoothedStreamPrice({
      ...baseParams,
      sessionStartGatingEnabled: false,
      sessionMarket: 'nyse',
      sessionMarketType: '24/5',
    })

    expect(gatingArg()).toBeUndefined()
  })

  it('still returns the price (pass-through) for a pre-session report when gating is skipped', async () => {
    // The mocked getPrice resolves regardless of timestamps — with no gating object
    // there is no session start to reject against, so the (possibly pre-session)
    // report flows straight through.
    const result = await smoothedStreamPrice({
      ...baseParams,
      sessionStartGatingEnabled: true,
    })

    expect(result).toHaveLength(1)
    expect(result[0].result.toString()).toEqual('100') // 1 * 10^8 / 10^6
  })
})
