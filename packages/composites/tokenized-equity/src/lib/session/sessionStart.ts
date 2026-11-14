import { TwentyfourFiveMarketStatus } from '@chainlink/external-adapter-framework/adapter'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'

import { SessionTransition } from './tradingHoursSession'

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
