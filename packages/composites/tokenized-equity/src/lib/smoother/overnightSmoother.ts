import { EmaFilter } from './ema'

// Exported so tests can assert against the real values rather than duplicating them.
//
// Corresponds to an effective alpha of ~0.012 at a 1s sampling interval, versus the
// transition EMA's ~0.095 — overnight ticks are sparser, so this leans much slower.
export const TAU_MS = 83_000
// Deliberately longer than the transition filters' 10-minute idle timeout, since
// overnight ticks may be much sparser.
export const TIMEOUT_MS = 30 * 60 * 1000
// How long before the OVERNIGHT session actually starts to begin feeding the filter, so
// it isn't cold-starting at the exact moment it starts being published.
export const WARMUP_MS = 60_000

/**
 * Overnight-session EMA.
 *
 * `SessionAwareSmoother` only smooths in short windows (-10s/+60s) around a session
 * boundary, which leaves the multi-hour middle of the overnight session unsmoothed.
 * This is a second, independent EMA that runs continuously for as long as the selected
 * feed reports OVERNIGHT, with its own time constant and idle timeout (overnight ticks
 * are sparser than the ~1s cadence the transition EMA assumes).
 *
 * It operates directly on the raw price, not on the transition-blend output, and is not
 * chained onto it.
 *
 * `shouldSmooth` is not simply "is the feed reporting OVERNIGHT right now" — callers
 * also feed it a short warm-up window immediately before the overnight session starts,
 * so the filter already has an established value by the time it starts driving the
 * published result, rather than cold-starting right at the boundary.
 */
const overnightFilters: Record<string, EmaFilter> = {}

export const processOvernightUpdate = (asset: string, rawPrice: bigint, shouldSmooth: boolean) => {
  if (!overnightFilters[asset]) {
    overnightFilters[asset] = new EmaFilter(TAU_MS, TIMEOUT_MS)
  }

  if (!shouldSmooth) {
    // Deliberately not fed outside the overnight session (and its warm-up window).
    // That freezes the filter's internal clock, so by the time the next overnight
    // session starts — hours later, always exceeding `timeoutMs` — `EmaFilter.smooth`'s
    // own idle-timeout logic resets it to a cold start. Each night gets a fresh EMA for
    // free, no extra reset logic.
    // `p` mirrors EmaFilter.smooth()'s `p`, which is the elapsed interval in ms
    // (a number), not a price-scaled bigint like `price`/`x` — 0 here means "no
    // reading, no elapsed interval", consistent with that meaning.
    return { price: rawPrice, x: 0n, p: 0 }
  }

  return overnightFilters[asset].smooth(rawPrice)
}
