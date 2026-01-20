// Algorithm by @kalanyuz and @eshaqiri
import { deScale, scale } from './utils'

const ALPHA_BASE = 0.095
const DT_BASE_MS = 1000
const CONFIG = {
  ALPHA: ALPHA_BASE,
  DT_BASE_MS,
  // Convert (alpha_base, dt_base_ms) -> tau_ms
  // alpha_base = 1 - exp(-dt_base_ms/tau_ms) => tau_ms = -dt_base_ms / ln(1 - alpha_base)
  TAU_MS: -DT_BASE_MS / Math.log(1.0 - ALPHA_BASE),
}

// Time-aware Exponential Moving Average for irregularly sampled updates, using millisecond resolution everywhere.
// alpha in (0, 1], calibrated for a base sampling interval dt_base_ms (default 1000 ms).
// At runtime, for each update with elapsed time dt_ms:
//   alpha_eff = 1 - exp(-dt_ms / tau_ms)
// where tau_ms is derived from (alpha, dt_base_ms).
export class EmaFilter {
  private x = -1n // Previous smoothed price
  private p = 0 // Previous price update timestamp

  public smooth(price: bigint) {
    const prevX = this.x
    const now = Date.now()
    const interval = now - this.p

    if (this.x < 0n || this.p === 0) {
      this.x = price
      this.p = now
    } else if (interval > 0) {
      // Time-aware effective alpha: a = 1 - exp(-dt_ms/tau_ms)
      const a = scale(CONFIG.TAU_MS <= 0.0 ? 1.0 : -Math.expm1(-interval / CONFIG.TAU_MS))

      this.x = deScale(a * price + (scale(1) - a) * this.x)
      this.p = now
    }

    return { price: this.x, x: prevX, p: interval }
  }
}
