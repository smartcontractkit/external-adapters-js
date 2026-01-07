// Algorithm by @kalanyuz and @eshaqiri
import { EmaFilter } from './ema'
import { KalmanFilter } from './kalman'
import { deScale, scale } from './utils'

const CONFIG = {
  WINDOW_BEFORE: 10, // seconds
  WINDOW_AFTER: 60, // seconds
}

/**
 * Session Aware Smoother
 *
 * Manages the transition state and applies the weighted blending
 * between raw and smoothed prices.
 */
export class SessionAwareSmoother {
  private kalmanFilter = new KalmanFilter()
  private emafilter = new EmaFilter()

  /**
   * Process a new price update
   * @param smoother The smoothing algorithm to use
   * @param rawPrice The current raw median price
   * @param spread The current spread between ask and bid prices
   * @param secondsFromTransition Seconds relative to session boundary (-ve before, +ve after)
   */
  public processUpdate(
    smoother: string,
    rawPrice: bigint,
    spread: bigint,
    secondsFromTransition: number,
  ) {
    // Calculate blending weight
    const w = this.calculateTransitionWeight(secondsFromTransition)

    // Calculate smoothed price
    const smoothedPrice =
      smoother === 'kalman'
        ? this.kalmanFilter.smooth(rawPrice, spread)
        : this.emafilter.smooth(rawPrice)

    // Apply blending: price_output = smoothed * w  + raw * (1 - w)
    return {
      price: deScale(smoothedPrice.price * scale(w) + rawPrice * (scale(1) - scale(w))),
      x: smoothedPrice.x,
      p: smoothedPrice.p,
    }
  }

  // Calculates the raised cosine decay weight
  private calculateTransitionWeight(t: number): number {
    const { WINDOW_BEFORE, WINDOW_AFTER } = CONFIG

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
