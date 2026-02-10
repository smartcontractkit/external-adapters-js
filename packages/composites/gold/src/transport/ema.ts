// Copied and adjusted from ondo-calculated
// EMA algorithm by @kalanyuz and @eshaqiri

export const PRECISION = 18 // Keep 18 decimals when converting number to bigint

export const scale = (number: number): bigint => BigInt(Math.floor(number * 10 ** PRECISION))
export const deScale = (bigint: bigint) => bigint / 10n ** BigInt(PRECISION)

// Time-aware Exponential Moving Average for irregularly sampled updates, using millisecond resolution everywhere.
// alpha in (0, 1], calibrated for a base sampling interval dt_base_ms (default 1000 ms).
// At runtime, for each update with elapsed time dt_ms:
//   alpha_eff = 1 - exp(-dt_ms / tau_ms)
// where tau_ms is the configured parameter.

export type EmaState = {
  average: bigint
  timestampMs: number
}

export const updateEma = (
  previousState: EmaState,
  newDataPoint: bigint,
  nowMs: number,
  tauMs: number,
): EmaState => {
  const interval = nowMs - previousState.timestampMs

  if (interval === 0) {
    return previousState
  }

  // Time-aware effective alpha: a = 1 - exp(-dt_ms/tau_ms)
  const a = scale(-Math.expm1(-interval / tauMs))

  return {
    average: deScale(a * newDataPoint + (scale(1) - a) * previousState.average),
    timestampMs: nowMs,
  }
}
