import { TwentyfourFiveMarketStatus } from '@chainlink/external-adapter-framework/adapter'

export type SessionSource = 'TRADINGHOURS' | 'FALLBACK'

/**
 * A scheduled session start. `status` is UNKNOWN for entries derived from the
 * configured fallback boundaries, which carry no status information.
 */
export type SessionEvent = {
  status: TwentyfourFiveMarketStatus
  startMs: number
}

export type SessionContext = {
  /** Signed seconds from now to the nearest smoothing boundary. */
  secondsFromTransition?: number
  /** Where the session schedule came from. */
  source: SessionSource
  /** All scheduled session starts (including REGULAR), sorted ascending. */
  events: SessionEvent[]
  /**
   * The session that should be open now, according to the tradinghours
   * market-status endpoint. Falls back to the latest scheduled event when that
   * lookup fails, and is undefined for the fallback boundary schedule.
   */
  expectedStatus?: TwentyfourFiveMarketStatus
  /** Weekly closure window passed to the tradinghours market-status endpoint. */
  weekend: string
}
