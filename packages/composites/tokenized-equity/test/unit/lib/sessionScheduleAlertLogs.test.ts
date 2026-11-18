import { TwentyfourFiveMarketStatus } from '@chainlink/external-adapter-framework/adapter'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'

// The schedule-underdetermination log lines are the alert surface (docs:
// stream-freshness-gating-tdd.md §5, issuer-247-session-start-gating-tdd.md §5):
// a single greppable token ("Market schedule undetermined") covers every cause,
// with a reason suffix discriminating them. These tests pin the token, the
// reasons, and when each fires.
// The mock factory must be self-contained (hoisted above imports); every module
// under test shares the one logger instance.
jest.mock('@chainlink/external-adapter-framework/util', () => {
  const logger = {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    trace: jest.fn(),
    fatal: jest.fn(),
  }
  return {
    ...jest.requireActual('@chainlink/external-adapter-framework/util'),
    makeLogger: jest.fn(() => logger),
  }
})

import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { gateIssuer247Report } from '../../../src/lib/session/issuer247Gating'
import { getSessionSchedule } from '../../../src/lib/session/session'
import {
  getSessionTransitions,
  SessionTransition,
} from '../../../src/lib/session/tradingHoursSession'

// The single logger instance every module under test gets from the mocked factory.
const mockLogger = (makeLogger as unknown as jest.Mock)()

const NOW_MONDAY = new Date('2024-01-15T15:00:00.000Z').getTime() // Mon 10:00 ET

const okRequester = (result: unknown[]) =>
  ({
    request: jest.fn().mockResolvedValue({
      response: { data: { data: { result } }, statusCode: 200 },
    }),
  } as unknown as Requester)

const failingRequester = () =>
  ({
    request: jest.fn().mockRejectedValue(new Error('tradinghours down')),
  } as unknown as Requester)

// Calls to logger.error carrying the "Market schedule undetermined" token (other
// error lines — e.g. 'TradingHoursEA request failed' — are not this alert).
const undeterminedCalls = () =>
  (mockLogger.error.mock.calls as unknown[][]).filter((args) =>
    String(args[0]).includes('Market schedule undetermined'),
  )

describe('getSessionSchedule schedule-underdetermination logs', () => {
  beforeAll(() => {
    jest.useFakeTimers()
    jest.setSystemTime(NOW_MONDAY)
  })

  afterAll(() => {
    jest.useRealTimers()
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('logs "invalid market session name" and skips the fetch for an unknown marketType', async () => {
    const requester = okRequester([])

    const result = await getSessionSchedule(
      'https://tradinghours.example.com',
      requester,
      [],
      undefined,
      'nyse',
      '24/6', // not a real market session name
    )

    expect(result).toEqual({ fallbackTransitions: undefined })
    expect(requester.request).not.toHaveBeenCalled()
    expect(mockLogger.error).toHaveBeenCalledTimes(1)
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('Market schedule undetermined: invalid market session name'),
    )
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('[market=nyse marketType=24/6]'),
    )
  })

  it('logs nothing for a market with no fallback entry while tradinghours is healthy (tier 1 still gates)', async () => {
    // The error claims fail-closed; with a working tradinghours that is not true,
    // so it must not fire during healthy operation. (sessionBoundariesTimeZone is
    // what lets the fetch run at all for a market with no schedule entry.)
    const result = await getSessionSchedule(
      'https://tradinghours.example.com',
      okRequester([]),
      [],
      'America/New_York',
      'lse', // valid session name, no fallback entry
      '24/5',
    )

    expect(result.fallbackTransitions).toBeUndefined()
    expect(result.transitions).toEqual([])
    expect(undeterminedCalls()).toHaveLength(0)
  })

  it('logs "no fallback schedule entry" for a market with no hard-coded entry when tradinghours also fails', async () => {
    const requester = failingRequester()

    const result = await getSessionSchedule(
      'https://tradinghours.example.com',
      requester,
      [],
      'America/New_York',
      'lse', // valid session name, no fallback entry
      '24/5',
    )

    expect(result.fallbackTransitions).toBeUndefined()
    expect(undeterminedCalls()).toHaveLength(1)
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('Market schedule undetermined: no fallback schedule entry'),
    )
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('[market=lse marketType=24/5]'),
    )
  })

  it('logs nothing for a known market/type', async () => {
    const result = await getSessionSchedule(
      'https://tradinghours.example.com',
      okRequester([]),
      [],
      undefined,
      'nyse',
      '24/5',
    )

    expect(result.fallbackTransitions).toBeDefined()
    expect(mockLogger.error).not.toHaveBeenCalled()
  })

  it('logs nothing when no market identity is provided (gating skipped entirely)', async () => {
    await getSessionSchedule('https://tradinghours.example.com', okRequester([]), [])

    expect(mockLogger.error).not.toHaveBeenCalled()
  })

  it('throttles repeat logs for the same market|marketType to one per minute', async () => {
    const requester = failingRequester()
    const call = () =>
      getSessionSchedule(
        'https://tradinghours.example.com',
        requester,
        [],
        undefined,
        'lse',
        'regular', // valid session name, no fallback entry — distinct key from the tests above
      )

    await call()
    await call()
    expect(undeterminedCalls()).toHaveLength(1)

    // Past the throttle window the condition is logged again (still loud).
    jest.setSystemTime(NOW_MONDAY + 60_000)
    await call()
    expect(undeterminedCalls()).toHaveLength(2)
    jest.setSystemTime(NOW_MONDAY)
  })
})

describe('tradinghours malformed schedule handling', () => {
  it.each([
    [
      'unparseable phase start',
      [{ status: TwentyfourFiveMarketStatus.REGULAR, statusString: 'REGULAR', time: 'not-a-date' }],
    ],
    [
      'unparseable phase end',
      [
        {
          status: TwentyfourFiveMarketStatus.REGULAR,
          statusString: 'REGULAR',
          time: '2024-01-15T14:30:00.000Z',
          endTime: 'not-a-date',
        },
      ],
    ],
  ])(
    'rejects the whole schedule on %s (the caller falls back like any tradinghours failure)',
    async (_name, result) => {
      const requester = okRequester(result)

      await expect(
        getSessionTransitions('https://tradinghours.example.com', requester, 'UTC', 'nyse', '24/5'),
      ).rejects.toThrow(
        /TradingHoursEA request failed: TradingHours EA returned a malformed market-session schedule entry/,
      )
    },
  )

  it('throws an AdapterError, not an unguarded exception', async () => {
    const requester = okRequester([
      { status: TwentyfourFiveMarketStatus.REGULAR, statusString: 'REGULAR', time: '' },
    ])

    const err = await getSessionTransitions(
      'https://tradinghours.example.com',
      requester,
      'UTC',
      'nyse',
      '24/5',
    ).catch((e) => e)
    expect(err).toBeInstanceOf(AdapterError)
  })
})

describe('24/7 fallback-activation warn (parity with the 24/5 line in streams.ts)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // A fetched schedule that cannot open the report's session (e.g. a future
  // PRE_MARKET only), while the fallback supplies a past REGULAR open.
  const unusableTradingHours: SessionTransition[] = [
    {
      status: TwentyfourFiveMarketStatus.PRE_MARKET,
      timeMs: NOW_MONDAY + 60_000,
      endTimeMs: NOW_MONDAY + 120_000,
    },
  ]
  const fallback: SessionTransition[] = [
    {
      status: TwentyfourFiveMarketStatus.REGULAR,
      timeMs: NOW_MONDAY - 60_000,
      endTimeMs: NOW_MONDAY + 60_000,
    },
  ]
  const inSessionReport = {
    marketStatus: TwentyfourFiveMarketStatus.REGULAR,
    lastSeenTimestampNs: (BigInt(NOW_MONDAY) * 10n ** 6n).toString(),
    nowMs: NOW_MONDAY,
  }

  it('warns when the fetched schedule is present but unusable and the fallback supplies the start', () => {
    const result = gateIssuer247Report({
      ...inSessionReport,
      transitions: unusableTradingHours,
      fallbackTransitions: fallback,
    })

    expect(result.gatingSessionSource).toBe('FALLBACK')
    expect(mockLogger.warn).toHaveBeenCalledTimes(1)
    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.stringContaining(
        "fetched tradinghours schedule has no transition opening the report's session",
      ),
    )
  })

  it('does not warn when the tradinghours schedule resolves the start', () => {
    const result = gateIssuer247Report({
      ...inSessionReport,
      transitions: fallback,
      fallbackTransitions: fallback,
    })

    expect(result.gatingSessionSource).toBe('TRADINGHOURS')
    expect(mockLogger.warn).not.toHaveBeenCalled()
  })

  it('does not warn on the marketSessionOverride path (fallback deliberately never consulted)', () => {
    // The override gates against the NEXT PRE_MARKET (now+60s), so the report is
    // rejected as pre-session — the point here is only that no warn fires.
    expect(() =>
      gateIssuer247Report({
        ...inSessionReport,
        transitions: unusableTradingHours,
        fallbackTransitions: fallback,
        marketSessionOverride: TwentyfourFiveMarketStatus.PRE_MARKET,
      }),
    ).toThrow(/PRE_SESSION/)

    expect(mockLogger.warn).not.toHaveBeenCalled()
  })
})
