// Algorithm by @kalanyuz and Enea Shaqiri
import { parseUnits } from 'ethers'

const PRECISION = 18 // Keep 18 decimals when converting number to bigint

const CONFIG = {
  KALMAN: {
    Q: parseUnits('0.000075107026567861', PRECISION), // Process noise
    ALPHA: parseUnits('0.9996386263245117', PRECISION), // Spread-to-noise multiplier
    INITIAL_P: parseUnits('1.5', PRECISION), // initial covariance
    MIN_R: parseUnits('0.002545840040746239', PRECISION), // Measurement noise floor
    DECAY_FACTOR: parseUnits('0.99', PRECISION), //Covariance decay
  },
  TRANSITION: {
    WINDOW_BEFORE: 10, // seconds
    WINDOW_AFTER: 60, // seconds
  },
}

// 1D Kalman filter for price with measurement noise based on spread
class KalmanFilter {
  private x = -1n
  private p = CONFIG.KALMAN.INITIAL_P

  public smooth(price: bigint, spread: bigint) {
    const prevX = this.x
    const prevP = this.p

    if (this.x < 0n) {
      this.x = price
      return { price: this.x, x: prevX, p: prevP }
    }

    // Predict
    const x_pred = this.x
    const p_pred = deScale(this.p * CONFIG.KALMAN.DECAY_FACTOR) + CONFIG.KALMAN.Q

    // Measurement noise from spread (handle None / <=0)
    const eff_spread = spread > CONFIG.KALMAN.MIN_R ? spread : CONFIG.KALMAN.MIN_R
    const r = deScale(CONFIG.KALMAN.ALPHA * eff_spread)
    // Update
    const k = (p_pred * scale(1)) / (p_pred + r)
    this.x = x_pred + deScale(k * (price - x_pred))
    this.p = deScale((scale(1) - k) * p_pred)
    return { price: this.x, x: prevX, p: prevP }
  }
}

/**
 * Session Aware Smoother
 *
 * Manages the transition state and applies the weighted blending
 * between raw and smoothed prices.
 */
export class SessionAwareSmoother {
  private filter: KalmanFilter = new KalmanFilter()

  /**
   * Process a new price update
   * @param rawPrice The current raw median price
   * @param spread The current spread between ask and bid prices
   * @param secondsFromTransition Seconds relative to session boundary (-ve before, +ve after)
   */
  public processUpdate(rawPrice: bigint, spread: bigint, secondsFromTransition: number) {
    // Calculate blending weight
    const w = this.calculateTransitionWeight(secondsFromTransition)

    // Calculate smoothed price
    const smoothedPrice = this.filter.smooth(rawPrice, spread)

    // Apply blending: price_output = smoothed * w  + raw * (1 - w)
    return {
      price: deScale(smoothedPrice.price * scale(w) + rawPrice * (scale(1) - scale(w))),
      x: smoothedPrice.x,
      p: smoothedPrice.p,
    }
  }

  // Calculates the raised cosine decay weight
  private calculateTransitionWeight(t: number): number {
    const { WINDOW_BEFORE, WINDOW_AFTER } = CONFIG.TRANSITION

    // Outside window
    if (t < -WINDOW_BEFORE || t > WINDOW_AFTER) {
      return 0.0
    }

    // Select window side
    const window = t < 0 ? WINDOW_BEFORE : WINDOW_AFTER

    // Raised cosine function: 0.5 * (1 + cos(pi * t / window))
    // At t=0, cos(0)=1 -> w=1.0 (Fully smoothed)
    // At t=window, cos(pi)=-1 -> w=0.0 (Fully raw)
    // At t=-window, cos(-pi)=-1 -> w=0.0
    return 0.5 * (1 + Math.cos((Math.PI * t) / window))
  }
}

const scale = (number: number) => parseUnits(number.toFixed(PRECISION), PRECISION)
const deScale = (bigint: bigint) => bigint / 10n ** BigInt(PRECISION)
