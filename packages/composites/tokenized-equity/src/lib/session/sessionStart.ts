import { TwentyfourFiveMarketStatus } from '@chainlink/external-adapter-framework/adapter'
import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'

import { SessionTransition } from './tradingHoursSession'

const logger = makeLogger('SessionStart')

// Shared session-start helpers used by both the 24/5 stream gate (lib/streams.ts)
// and the 24/7 report gate (lib/session/issuer247Gating.ts). The gating rule is the
// same on both paths; only what declares the session differs (stream eligibility vs
// the report's own marketStatus).

// Latest transition at or before `now` whose status opens one of `statuses` — i.e.
// the start time of the currently active session for a stream/report eligible in
// `statuses`.
export const currentSessionStartMs = (
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

// Earliest transition strictly after `now` whose status opens `status` — the next
// start of the named session. Used only by the marketSessionOverride test hook
// (24/5 and 24/7 session-start gating).
export const nextSessionStartMs = (
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

// String → enum for the marketSessionOverride test hook (24/5 and 24/7
// session-start gating). The endpoint's options list normally rejects unknown
// names with a 400; if that ever drifts, a missed lookup would silently no-op
// the hook (undefined → non-override path) — loud instead, so a staging tester
// sees that the override did nothing.
export const parseMarketSessionOverride = (
  override: string | undefined,
): TwentyfourFiveMarketStatus | undefined => {
  if (!override) {
    return undefined
  }
  const status = TwentyfourFiveMarketStatus[override as keyof typeof TwentyfourFiveMarketStatus]
  if (status === undefined) {
    logger.warn(
      `marketSessionOverride=${JSON.stringify(
        override,
      )} is not a TwentyfourFiveMarketStatus name; ignoring it (request gates against the wall clock)`,
    )
  }
  return status
}

// BigInt('') is 0n (no throw), so validate the integer format explicitly; a
// malformed provider timestamp is an upstream-data problem — reject with 503 like
// the other data rejections, not an unguarded SyntaxError surfacing as a 502.
export const reportTimeMs = (lastSeenTimestampNs: string): number => {
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
