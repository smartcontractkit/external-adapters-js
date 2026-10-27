import { TwentyfourFiveMarketStatus } from '@chainlink/external-adapter-framework/adapter'
import { latestEventAtOrBefore } from './session'
import type { SessionContext } from './types'

export type SessionReport = {
  marketStatus: TwentyfourFiveMarketStatus
  lastSeenTimestampNs: string
}

export type GateDecision =
  | {
      eligible: true
      reportTimestampMs: number
      sessionStartMs: number
      expectedStatus?: TwentyfourFiveMarketStatus
    }
  | { eligible: false; reason: string }

export type SessionGateParams = {
  report: SessionReport
  session: SessionContext
  nowMs: number
}

/**
 * Decides whether a report may be published.
 *
 * The report must:
 * 1. belong to the session that is expected now (per tradinghours market-status),
 * 2. have been produced at or after that session's scheduled start.
 *
 * When the schedule is unavailable and fallback boundaries are in use, only the
 * start-time check is possible.
 */
export const evaluateSessionGate = ({
  report,
  session,
  nowMs,
}: SessionGateParams): GateDecision => {
  let reportTimestampMs: number
  try {
    reportTimestampMs = Number(BigInt(report.lastSeenTimestampNs) / 1_000_000n)
  } catch {
    return reject('report is missing a valid lastSeenTimestampNs')
  }

  if (!Number.isFinite(reportTimestampMs)) {
    return reject('report is missing a valid lastSeenTimestampNs')
  }

  const current = latestEventAtOrBefore(session.events, nowMs)
  if (!current) {
    return reject('no scheduled session start is known')
  }

  if (session.source === 'FALLBACK') {
    if (reportTimestampMs < current.startMs) {
      return reject(
        `report last seen ${iso(reportTimestampMs)} predates the current session start ${iso(
          current.startMs,
        )}`,
      )
    }
    return accept(reportTimestampMs, current.startMs)
  }

  const expectedStatus = session.expectedStatus
  if (expectedStatus === undefined) {
    return reject('unable to determine the expected session')
  }

  if (
    expectedStatus === TwentyfourFiveMarketStatus.WEEKEND ||
    expectedStatus === TwentyfourFiveMarketStatus.UNKNOWN
  ) {
    return reject(`market is closed (${statusName(expectedStatus)})`)
  }

  if (current.status !== expectedStatus) {
    return reject(
      `schedule is in ${statusName(current.status)} but market status is ${statusName(
        expectedStatus,
      )}`,
    )
  }

  if (report.marketStatus !== expectedStatus) {
    return reject(
      `report is for ${statusName(report.marketStatus)} but ${statusName(
        expectedStatus,
      )} is expected`,
    )
  }

  if (reportTimestampMs < current.startMs) {
    return reject(
      `report last seen ${iso(reportTimestampMs)} predates ${statusName(
        expectedStatus,
      )} session start ${iso(current.startMs)}`,
    )
  }

  return accept(reportTimestampMs, current.startMs, expectedStatus)
}

const accept = (
  reportTimestampMs: number,
  sessionStartMs: number,
  expectedStatus?: TwentyfourFiveMarketStatus,
): GateDecision => ({
  eligible: true,
  reportTimestampMs,
  sessionStartMs,
  expectedStatus,
})

const reject = (reason: string): GateDecision => ({ eligible: false, reason })

const statusName = (status: TwentyfourFiveMarketStatus): string =>
  TwentyfourFiveMarketStatus[status] ?? String(status)

const iso = (ms: number): string => new Date(ms).toISOString()
