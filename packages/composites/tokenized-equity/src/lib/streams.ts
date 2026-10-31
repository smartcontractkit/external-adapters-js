import { Requester } from '@chainlink/external-adapter-framework/util/requester'

import { getDeutscheBoersePrice } from '@chainlink/data-engine-adapter'
import { BaseEndpointTypes } from '@chainlink/data-engine-adapter/src/endpoint/deutscheBoerseV11'
import { TwentyfourFiveMarketStatus } from '@chainlink/external-adapter-framework/adapter'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { SessionTransition } from './session/tradingHoursSession'

type DataEngineResponse = BaseEndpointTypes['Response']['Data']

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
 * Pre-open warm-up (session-start) gating. Passing this object enables the check;
 * `transitions` is the tradinghours market-session schedule. When the schedule is
 * unavailable (undefined) the check fails closed: a report whose session start cannot
 * be determined is rejected rather than passed through.
 */
export type SessionStartGating = {
  transitions?: SessionTransition[]
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

const reportTimeMs = (lastSeenTimestampNs: string): number =>
  Number(BigInt(lastSeenTimestampNs) / 10n ** 6n)

export const getPrice = async (
  url: string,
  requester: Requester,
  regularStreamId?: string,
  extendedStreamId?: string,
  overnightStreamId?: string,
  overnightStreamMaxAgeInSeconds?: number,
  streamMaxAgeSeconds?: StreamMaxAgeSeconds,
  sessionStartGating?: SessionStartGating,
) => {
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

  const stream = getStream(regular, extended, overnight, streamMaxAgeSeconds, sessionStartGating)

  return {
    price: stream.mid,
    spread: BigInt(stream.ask) - BigInt(stream.bid),
    decimals: stream.decimals,
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
const reportAgeSeconds = (lastSeenTimestampNs: string): number =>
  (Date.now() - reportTimeMs(lastSeenTimestampNs)) / 1000

type StreamCandidate = {
  name: keyof StreamMaxAgeSeconds
  result: PromiseSettledResult<DataEngineResponse>
  // marketStatus values that make this stream eligible for selection
  eligibleStatuses: TwentyfourFiveMarketStatus[]
  maxAgeSeconds?: number
}

const describeCandidate = (c: StreamCandidate, sessionStartGating?: SessionStartGating): string => {
  if (c.result.status !== 'fulfilled') {
    // NB: the double space matches the historical message format asserted by existing tests
    return `${c.name}  ${c.result.reason}`
  }
  const status = TwentyfourFiveMarketStatus[c.result.value.marketStatus]
  const age = reportAgeSeconds(c.result.value.lastSeenTimestampNs)
  if (c.maxAgeSeconds !== undefined && age > c.maxAgeSeconds) {
    return `${c.name} STALE(${status}, age=${age.toFixed(0)}s>${c.maxAgeSeconds}s)`
  }
  const preSession = preSessionSeconds(c, sessionStartGating)
  if (preSession !== undefined) {
    return `${c.name} PRE_SESSION(${status}, lastSeen ${preSession.toFixed(
      0,
    )}s before session start)`
  }
  return `${c.name} ${status}`
}

// Seconds by which the report predates the current session start, or undefined when the
// report is in-session (or gating is off / the session start is unknown).
const preSessionSeconds = (
  c: StreamCandidate,
  sessionStartGating?: SessionStartGating,
): number | undefined => {
  if (!sessionStartGating?.transitions || c.result.status !== 'fulfilled') {
    return undefined
  }
  const start = currentSessionStartMs(
    c.eligibleStatuses,
    sessionStartGating.transitions,
    Date.now(),
  )
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
) => {
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

  // Select by session status first (priority order regular → extended → overnight),
  // then apply the staleness check to the selected stream. A stale selected stream is
  // rejected outright rather than failing over to a fresher stream of a different
  // session type, which would silently change the pricing source.
  const selected = candidates.find(
    (c) =>
      c.result.status === 'fulfilled' && c.eligibleStatuses.includes(c.result.value.marketStatus),
  )

  if (selected) {
    const value = (selected.result as PromiseFulfilledResult<DataEngineResponse>).value
    const age = reportAgeSeconds(value.lastSeenTimestampNs)
    if (selected.maxAgeSeconds !== undefined && age > selected.maxAgeSeconds) {
      throw new AdapterError({
        statusCode: 503,
        message: `Market data is stale: ${candidates
          .map((c) => describeCandidate(c, sessionStartGating))
          .join(', ')}`,
      })
    }
    if (sessionStartGating) {
      // Fail closed: with gating enabled, a report whose session start is unknown is
      // rejected — we cannot prove it is not a pre-session leftover.
      if (!sessionStartGating.transitions) {
        throw new AdapterError({
          statusCode: 503,
          message: `Session start unknown (session schedule unavailable): ${candidates
            .map((c) => describeCandidate(c, sessionStartGating))
            .join(', ')}`,
        })
      }
      const start = currentSessionStartMs(
        selected.eligibleStatuses,
        sessionStartGating.transitions,
        Date.now(),
      )
      if (start === undefined) {
        throw new AdapterError({
          statusCode: 503,
          message: `Session start unknown (no ${
            TwentyfourFiveMarketStatus[value.marketStatus]
          } transition in session schedule): ${candidates
            .map((c) => describeCandidate(c, sessionStartGating))
            .join(', ')}`,
        })
      }
      const lastSeenMs = reportTimeMs(value.lastSeenTimestampNs)
      if (lastSeenMs < start) {
        throw new AdapterError({
          statusCode: 503,
          message: `Market data predates session start: ${candidates
            .map((c) => describeCandidate(c, sessionStartGating))
            .join(', ')}`,
        })
      }
    }
    return value
  }

  throw new AdapterError({
    statusCode: 503,
    message: `Market is not open: ${candidates
      .map((c) => describeCandidate(c, sessionStartGating))
      .join(', ')}`,
  })
}
