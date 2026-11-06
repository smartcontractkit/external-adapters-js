import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'

import { getDeutscheBoersePrice } from '@chainlink/data-engine-adapter'
import { BaseEndpointTypes } from '@chainlink/data-engine-adapter/src/endpoint/deutscheBoerseV11'
import { TwentyfourFiveMarketStatus } from '@chainlink/external-adapter-framework/adapter'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { SessionTransition } from './session/tradingHoursSession'

type DataEngineResponse = BaseEndpointTypes['Response']['Data']

const logger = makeLogger('Streams')

/**
 * Per-session staleness thresholds in seconds (resolved from the
 * DS_VALID_MAX_AGE_SECONDS env family by resolveStreamMaxAgeSeconds). An
 * undefined value disables the check for that session's stream.
 */
export type StreamMaxAgeSeconds = {
  regular?: number
  extended?: number
  overnight?: number
}

/**
 * Pre-open warm-up (session-start) gating. Passing this object enables the check.
 * `transitions` is the tradinghours market-session schedule; `fallbackTransitions` is
 * the hard-coded labeled schedule for the feed's market/type. The current session start
 * is resolved from `transitions` first, then `fallbackTransitions` (tradinghours
 * unreachable, or a schedule with no transition opening the selected session). When
 * neither can supply the session start, the check fails closed (503).
 */
export type SessionStartGating = {
  transitions?: SessionTransition[]
  fallbackTransitions?: SessionTransition[]
  // Test hook: when set, gate against the NEXT start of this session (the first
  // tradinghours transition strictly after now) instead of the current session's
  // start — deterministically forcing the pre-session rejection. Resolved from the
  // tradinghours schedule only (never the hard-coded fallback); when no future
  // transition exists the check fails closed (503). Does not affect stream
  // selection, smoothing, or the staleness check.
  marketSessionOverride?: TwentyfourFiveMarketStatus
}

// Earliest transition strictly after `now` whose status opens `status` — the next
// start of the named session. Used only by the marketSessionOverride test hook.
const nextSessionStartMs = (
  status: TwentyfourFiveMarketStatus,
  transitions: SessionTransition[],
  nowMs: number,
): number | undefined =>
  transitions
    .filter((t) => t.status === status && t.timeMs > nowMs)
    .reduce<number | undefined>(
      (min, t) => (min === undefined || t.timeMs < min ? t.timeMs : min),
      undefined,
    )

// Marker appended to gating error messages and PRE_SESSION descriptions so a
// rejection forced by marketSessionOverride is unmistakable in staging logs.
const overrideMarker = (sessionStartGating: SessionStartGating): string =>
  sessionStartGating.marketSessionOverride !== undefined
    ? ` [marketSessionOverride=${
        TwentyfourFiveMarketStatus[sessionStartGating.marketSessionOverride]
      }]`
    : ''

/**
 * Request identity (asset / market / market session type) attached to error messages
 * so gating rejections in the logs can be traced back to the request that caused them.
 */
export type RequestContext = {
  asset?: string
  sessionMarket?: string
  sessionMarketType?: string
}

// Marker appended to error messages identifying the request being served, e.g.
// ` [asset=AAPL market=US marketType=24/5]`.
const contextMarker = (context?: RequestContext): string => {
  if (!context) {
    return ''
  }
  const parts = [
    context.asset && `asset=${context.asset}`,
    context.sessionMarket && `market=${context.sessionMarket}`,
    context.sessionMarketType && `marketType=${context.sessionMarketType}`,
  ].filter(Boolean)
  return parts.length ? ` [${parts.join(' ')}]` : ''
}

// Latest transition at or before `now` whose status opens one of `statuses` — i.e. the
// start time of the currently active session for a stream eligible in `statuses`.
const currentSessionStartMs = (
  statuses: TwentyfourFiveMarketStatus[],
  transitions: SessionTransition[],
  nowMs: number,
): number | undefined =>
  transitions
    .filter((t) => statuses.includes(t.status) && t.timeMs <= nowMs)
    .reduce<number | undefined>(
      (max, t) => (max === undefined || t.timeMs > max ? t.timeMs : max),
      undefined,
    )

export const reportTimeMs = (lastSeenTimestampNs: string): number => {
  // BigInt('') is 0n (no throw), so validate the integer format explicitly; a malformed
  // provider timestamp is an upstream-data problem — reject with 503 like the other data
  // rejections, not an unguarded SyntaxError surfacing as a 502.
  if (!/^\d+$/.test(lastSeenTimestampNs)) {
    throw new AdapterError({
      statusCode: 503,
      message: `Malformed lastSeenTimestampNs from data engine: ${JSON.stringify(
        lastSeenTimestampNs,
      )}`,
    })
  }
  return Number(BigInt(lastSeenTimestampNs) / 10n ** 6n)
}

export const getPrice = async (
  url: string,
  requester: Requester,
  regularStreamId?: string,
  extendedStreamId?: string,
  overnightStreamId?: string,
  overnightStreamMaxAgeInSeconds?: number,
  // Trailing options grouped: three adjacent optional positional args (two of them
  // objects) were too easy to transpose silently at call sites.
  options?: {
    streamMaxAgeSeconds?: StreamMaxAgeSeconds
    sessionStartGating?: SessionStartGating
    requestContext?: RequestContext
  },
) => {
  const { streamMaxAgeSeconds, sessionStartGating, requestContext } = options ?? {}
  const [regular, extended, overnight] = await Promise.allSettled(
    [regularStreamId, extendedStreamId, overnightStreamId].map((streamId) =>
      streamId
        ? getDeutscheBoersePrice(
            streamId,
            url,
            requester,
            streamId === overnightStreamId
              ? { maxAgeInSeconds: overnightStreamMaxAgeInSeconds }
              : {},
          )
        : Promise.reject(new Error('streamId not provided')),
    ),
  )

  const { stream, gatingSessionSource } = getStream(
    regular,
    extended,
    overnight,
    streamMaxAgeSeconds,
    sessionStartGating,
    requestContext,
  )

  return {
    price: stream.mid,
    spread: BigInt(stream.ask) - BigInt(stream.bid),
    decimals: stream.decimals,
    // Schedule source the session-start gate resolved from (TRADINGHOURS or FALLBACK),
    // undefined when gating is off or skipped — surfaced in responses so the gate's
    // fallback activation is visible even when the tradinghours fetch succeeded.
    gatingSessionSource,
    // Live status of the feed that was actually selected, exposed so callers can gate
    // on it directly rather than on the trading-hours schedule.
    marketStatus: stream.marketStatus,
    data: {
      regular: regular.status === 'fulfilled' ? regular.value : undefined,
      extended: extended.status === 'fulfilled' ? extended.value : undefined,
      overnight: overnight.status === 'fulfilled' ? overnight.value : undefined,
    },
  }
}

// Age in seconds of a report, from its provider-side lastSeenTimestampNs against the
// local clock. Thresholds are expected to be orders of magnitude larger than any NTP
// skew, so this does not need to be precise.
const reportAgeSeconds = (lastSeenTimestampNs: string, nowMs: number): number =>
  (nowMs - reportTimeMs(lastSeenTimestampNs)) / 1000

type StreamCandidate = {
  name: keyof StreamMaxAgeSeconds
  result: PromiseSettledResult<DataEngineResponse>
  // marketStatus values that make this stream eligible for selection
  eligibleStatuses: TwentyfourFiveMarketStatus[]
  maxAgeSeconds?: number
}

const describeCandidate = (
  c: StreamCandidate,
  sessionStartGating: SessionStartGating | undefined,
  nowMs: number,
): string => {
  if (c.result.status !== 'fulfilled') {
    // NB: the double space matches the historical message format asserted by existing tests
    return `${c.name}  ${c.result.reason}`
  }
  const status = TwentyfourFiveMarketStatus[c.result.value.marketStatus]
  const age = reportAgeSeconds(c.result.value.lastSeenTimestampNs, nowMs)
  const preSession = preSessionSeconds(c, sessionStartGating, nowMs)
  if (preSession !== undefined) {
    return `${c.name} PRE_SESSION(${status}, lastSeen ${preSession.toFixed(
      0,
    )}s before session start)${sessionStartGating ? overrideMarker(sessionStartGating) : ''}`
  }
  if (c.maxAgeSeconds !== undefined && age > c.maxAgeSeconds) {
    return `${c.name} STALE(${status}, age=${age.toFixed(0)}s>${c.maxAgeSeconds}s)`
  }
  // NB: the double space is the historical message format for fulfilled candidates too
  // (pre-existing log queries may be keyed on it) — same as the rejected branch above.
  return `${c.name}  ${status}`
}

// Start of the current session for a stream eligible in `statuses`: the latest
// transition at or before now from the tradinghours schedule, falling back to the
// hard-coded schedule — plus which source supplied it, so the gate's fallback
// activation is visible in telemetry even when the tradinghours fetch succeeded
// (a fetched schedule can lack a transition opening the selected session).
// startMs/source are undefined when neither source can place the session.
const gatingSessionStart = (
  statuses: TwentyfourFiveMarketStatus[],
  sessionStartGating: SessionStartGating,
  nowMs: number,
): { startMs?: number; source?: 'TRADINGHOURS' | 'FALLBACK' } => {
  if (sessionStartGating.marketSessionOverride !== undefined) {
    // Override: next start of the named session, tradinghours schedule only — the
    // hard-coded fallback is deliberately not consulted (per design: no future
    // transition in tradinghours means the check fails closed).
    const startMs =
      sessionStartGating.transitions &&
      nextSessionStartMs(
        sessionStartGating.marketSessionOverride,
        sessionStartGating.transitions,
        nowMs,
      )
    return { startMs, source: startMs === undefined ? undefined : 'TRADINGHOURS' }
  }
  const fromTradingHours =
    sessionStartGating.transitions &&
    currentSessionStartMs(statuses, sessionStartGating.transitions, nowMs)
  if (fromTradingHours !== undefined) {
    return { startMs: fromTradingHours, source: 'TRADINGHOURS' }
  }
  const fromFallback =
    sessionStartGating.fallbackTransitions &&
    currentSessionStartMs(statuses, sessionStartGating.fallbackTransitions, nowMs)
  return {
    startMs: fromFallback,
    source: fromFallback === undefined ? undefined : 'FALLBACK',
  }
}

// Seconds by which the report predates the current session start, or undefined when the
// report is in-session (or gating is off / the session start is unknown).
const preSessionSeconds = (
  c: StreamCandidate,
  sessionStartGating: SessionStartGating | undefined,
  nowMs: number,
): number | undefined => {
  if (!sessionStartGating || c.result.status !== 'fulfilled') {
    return undefined
  }
  const start = gatingSessionStart(c.eligibleStatuses, sessionStartGating, nowMs).startMs
  if (start === undefined) {
    return undefined
  }
  const delta = start - reportTimeMs(c.result.value.lastSeenTimestampNs)
  return delta > 0 ? delta / 1000 : undefined
}

const getStream = (
  regular: PromiseSettledResult<DataEngineResponse>,
  extended: PromiseSettledResult<DataEngineResponse>,
  overnight: PromiseSettledResult<DataEngineResponse>,
  streamMaxAgeSeconds?: StreamMaxAgeSeconds,
  sessionStartGating?: SessionStartGating,
  requestContext?: RequestContext,
) => {
  // One clock reading per request, shared by the gate, the staleness check, and the
  // message text — at a session boundary the decision and the description cannot
  // disagree about "now".
  const nowMs = Date.now()
  const describe = (c: StreamCandidate) => describeCandidate(c, sessionStartGating, nowMs)
  const candidates: StreamCandidate[] = [
    {
      name: 'regular',
      result: regular,
      eligibleStatuses: [TwentyfourFiveMarketStatus.REGULAR],
      maxAgeSeconds: streamMaxAgeSeconds?.regular,
    },
    {
      name: 'extended',
      result: extended,
      eligibleStatuses: [
        TwentyfourFiveMarketStatus.POST_MARKET,
        TwentyfourFiveMarketStatus.PRE_MARKET,
      ],
      maxAgeSeconds: streamMaxAgeSeconds?.extended,
    },
    {
      name: 'overnight',
      result: overnight,
      eligibleStatuses: [TwentyfourFiveMarketStatus.OVERNIGHT],
      maxAgeSeconds: streamMaxAgeSeconds?.overnight,
    },
  ]

  // Select by session status first (priority order regular → extended → overnight), then gate
  // the selected stream: session-start check before the staleness check — a pre-session
  // leftover is invalid regardless of age, so staleness only ever evaluates reports that
  // belong to the current session. A rejected selected stream never fails over to another
  // session type's stream, which would silently change the pricing source.
  const selected = candidates.find(
    (c) =>
      c.result.status === 'fulfilled' && c.eligibleStatuses.includes(c.result.value.marketStatus),
  )

  if (selected) {
    const value = (selected.result as PromiseFulfilledResult<DataEngineResponse>).value
    let gatingSessionSource: 'TRADINGHOURS' | 'FALLBACK' | undefined
    if (sessionStartGating) {
      // Tradinghours schedule first, hard-coded fallback second. Fail closed only when
      // neither can supply the session start (no market identity at all).
      const { startMs: start, source } = gatingSessionStart(
        selected.eligibleStatuses,
        sessionStartGating,
        nowMs,
      )
      gatingSessionSource = source
      if (
        source === 'FALLBACK' &&
        sessionStartGating.transitions !== undefined &&
        sessionStartGating.marketSessionOverride === undefined
      ) {
        // The fetch succeeded but the schedule has no transition opening the selected
        // session — no error line is logged on that path, so say so distinctly here;
        // otherwise the gate's fallback activation is invisible in telemetry.
        logger.warn(
          `Session-start gating: fetched tradinghours schedule has no transition opening the selected session; using the hard-coded fallback schedule${contextMarker(
            requestContext,
          )}`,
        )
      }
      if (start === undefined) {
        throw new AdapterError({
          statusCode: 503,
          message: `Session start unknown (no schedule available for ${
            TwentyfourFiveMarketStatus[value.marketStatus]
          }): ${candidates.map(describe).join(', ')}${overrideMarker(
            sessionStartGating,
          )}${contextMarker(requestContext)}`,
        })
      }
      const lastSeenMs = reportTimeMs(value.lastSeenTimestampNs)
      if (lastSeenMs < start) {
        throw new AdapterError({
          statusCode: 503,
          message: `Market data predates session start: ${candidates
            .map(describe)
            .join(', ')}${overrideMarker(sessionStartGating)}${contextMarker(requestContext)}`,
        })
      }
    }
    const age = reportAgeSeconds(value.lastSeenTimestampNs, nowMs)
    if (selected.maxAgeSeconds !== undefined && age > selected.maxAgeSeconds) {
      throw new AdapterError({
        statusCode: 503,
        message: `Market data is stale: ${candidates.map(describe).join(', ')}${contextMarker(
          requestContext,
        )}`,
      })
    }
    return { stream: value, gatingSessionSource }
  }

  throw new AdapterError({
    statusCode: 503,
    message: `Market is not open: ${candidates.map(describe).join(', ')}${contextMarker(
      requestContext,
    )}`,
  })
}
