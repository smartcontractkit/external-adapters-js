import { TwentyfourFiveMarketStatus } from '@chainlink/external-adapter-framework/adapter'
import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'

import { currentSessionStartMs, nextSessionStartMs, reportTimeMs } from './sessionStart'
import { SessionTransition } from './tradingHoursSession'

// Session-start gating for the 24/7 issuer-price-247 endpoint (TDD:
// docs/issuer-247-session-start-gating-tdd.md, ADR-0007). Unlike 24/5 — where the
// gate runs on the selected stream against schedule-derived sessions — a 24/7 report
// declares its own session via its marketStatus, and is rejected (503, zero
// tolerance) when its lastSeenTimestampNs predates that session's start. WEEKEND
// reports (which also cover holidays — the data-engine reports any closed span as
// status WEEKEND/5) gate against the start of the current closed span: the end of
// the last trading phase before the gap (tradinghours ADR-0001). Both schedule
// sources are shaped identically — raw session phases with ends, closures as an
// absence of phases — so one derivation rule covers tradinghours and fallback alike.

const logger = makeLogger('Issuer247SessionStartGating')

// The statuses whose transitions open the session a 24/7 report belongs to, per the
// report's marketStatus. PRE/POST_MARKET share the continuous extended session that
// opens at the pre-market open (04:00 ET). WEEKEND and UNKNOWN/unmapped return
// undefined: WEEKEND is gated by the closed-span rule below, and UNKNOWN is
// indeterminate (handled per failOnIndeterminate).
export const gatingStatusesFor247 = (
  marketStatus: TwentyfourFiveMarketStatus,
): TwentyfourFiveMarketStatus[] | undefined => {
  switch (marketStatus) {
    case TwentyfourFiveMarketStatus.REGULAR:
      return [TwentyfourFiveMarketStatus.REGULAR]
    case TwentyfourFiveMarketStatus.PRE_MARKET:
    case TwentyfourFiveMarketStatus.POST_MARKET:
      return [TwentyfourFiveMarketStatus.PRE_MARKET]
    case TwentyfourFiveMarketStatus.OVERNIGHT:
      return [TwentyfourFiveMarketStatus.OVERNIGHT]
    default:
      return undefined
  }
}

// Start of the current closed span, derived from real schedule data: the end of the
// last trading phase at or before now (e.g. Friday's post-market end, 20:00 ET, for
// a normal weekend; Wednesday's for a Thanksgiving closure). undefined when no
// transition is at or before now, or when the schedule lacks phase ends (a
// pre-endTime tradinghours deployment) — callers treat that as indeterminate.
export const closedSpanStartMs = (
  transitions: SessionTransition[],
  nowMs: number,
): number | undefined => {
  const last = transitions
    .filter((t) => t.timeMs <= nowMs)
    .reduce<SessionTransition | undefined>(
      (max, t) => (max === undefined || t.timeMs > max.timeMs ? t : max),
      undefined,
    )
  return last?.endTimeMs
}

// WEEKEND reports gate against the start of the current closed span, derived the
// same way from both schedule sources (tradinghours and the fallback are shaped
// identically: raw session phases with ends — closures are an absence of phases).

export type GateIssuer247ReportArgs = {
  marketStatus: TwentyfourFiveMarketStatus
  lastSeenTimestampNs: string
  nowMs: number
  transitions?: SessionTransition[]
  fallbackTransitions?: SessionTransition[]
  failOnIndeterminate: boolean
  // Staging/test hook (mirrors 24/5): gate against the NEXT start of the named
  // session instead of the current one, tradinghours transitions only — the
  // fallback schedule is never consulted, so no future transition fails closed.
  // Rejection messages carry a [marketSessionOverride=<STATUS>] marker.
  marketSessionOverride?: TwentyfourFiveMarketStatus
}

export type GateIssuer247ReportResult = {
  // Which schedule tier supplied the session start, for telemetry (undefined when
  // the request was served fail-open on an indeterminate session).
  gatingSessionSource?: 'TRADINGHOURS' | 'FALLBACK'
}

// The gate. Returns the schedule source on a pass; throws AdapterError(503) on
// rejection. Indeterminate sessions (UNKNOWN/unmapped marketStatus, or no schedule
// tier can resolve the session start) fail closed with 503 "Session start unknown"
// when failOnIndeterminate is on, or serve with a warning log when off — the
// escape hatch is never silent.
export const gateIssuer247Report = ({
  marketStatus,
  lastSeenTimestampNs,
  nowMs,
  transitions,
  fallbackTransitions,
  failOnIndeterminate,
  marketSessionOverride,
}: GateIssuer247ReportArgs): GateIssuer247ReportResult => {
  const reportMs = reportTimeMs(lastSeenTimestampNs)
  const status = TwentyfourFiveMarketStatus[marketStatus] ?? String(marketStatus)
  const overrideMarker =
    marketSessionOverride !== undefined
      ? ` [marketSessionOverride=${TwentyfourFiveMarketStatus[marketSessionOverride]}]`
      : ''

  let startMs: number | undefined
  let source: 'TRADINGHOURS' | 'FALLBACK' | undefined

  if (marketSessionOverride !== undefined) {
    // Override: next start of the named session, tradinghours schedule only — the
    // hard-coded fallback is deliberately never consulted (same rule as 24/5).
    startMs = transitions && nextSessionStartMs(marketSessionOverride, transitions, nowMs)
    source = startMs === undefined ? undefined : 'TRADINGHOURS'
  } else {
    const resolveStart = (ts: SessionTransition[] | undefined): number | undefined => {
      if (!ts) {
        return undefined
      }
      const statuses = gatingStatusesFor247(marketStatus)
      return marketStatus === TwentyfourFiveMarketStatus.WEEKEND
        ? closedSpanStartMs(ts, nowMs)
        : statuses
        ? currentSessionStartMs(statuses, ts, nowMs)
        : undefined
    }

    startMs = resolveStart(transitions)
    source = startMs !== undefined ? 'TRADINGHOURS' : undefined
    if (startMs === undefined) {
      startMs = resolveStart(fallbackTransitions)
      source = startMs !== undefined ? 'FALLBACK' : undefined
    }
  }

  if (startMs === undefined) {
    const reason = `Session start unknown for 24/7 report (marketStatus=${status})${overrideMarker}`
    if (failOnIndeterminate) {
      throw new AdapterError({ statusCode: 503, message: reason })
    }
    logger.warn(
      `${reason} — serving anyway (ISSUER_247_SESSION_GATING_FAIL_ON_INDETERMINATE_SESSION=false)`,
    )
    return { gatingSessionSource: undefined }
  }

  if (reportMs < startMs) {
    const preSessionSeconds = ((startMs - reportMs) / 1000).toFixed(0)
    throw new AdapterError({
      statusCode: 503,
      message: `Market data predates session start: PRE_SESSION(${status}, lastSeen ${preSessionSeconds}s before session start)${overrideMarker}`,
    })
  }

  return { gatingSessionSource: source }
}
