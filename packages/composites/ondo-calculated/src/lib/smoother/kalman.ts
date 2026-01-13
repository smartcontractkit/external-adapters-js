// Algorithm by @kalanyuz and @eshaqiri
import { parseUnits } from 'ethers'
import { deScale, PRECISION, scale } from './utils'

const CONFIG = {
  Q: parseUnits('0.000075107026567861', PRECISION), // Process noise
  ALPHA: parseUnits('0.9996386263245117', PRECISION), // Spread-to-noise multiplier
  INITIAL_P: parseUnits('1.5', PRECISION), // initial covariance
  MIN_R: parseUnits('0.002545840040746239', PRECISION), // Measurement noise floor
  DECAY_FACTOR: parseUnits('0.99', PRECISION), //Covariance decay
}

// 1D Kalman filter for price with measurement noise based on spread
export class KalmanFilter {
  private x = -1n
  private p = CONFIG.INITIAL_P

  public smooth(price: bigint, spread: bigint) {
    const prevX = this.x
    const prevP = this.p

    if (this.x < 0n) {
      this.x = price
      return { price: this.x, x: prevX, p: prevP }
    }

    // Predict
    const x_pred = this.x
    const p_pred = deScale(this.p * CONFIG.DECAY_FACTOR) + CONFIG.Q

    // Measurement noise from spread (handle None / <=0)
    const eff_spread = spread > CONFIG.MIN_R ? spread : CONFIG.MIN_R
    const r = deScale(CONFIG.ALPHA * eff_spread)
    // Update
    const k = (p_pred * scale(1)) / (p_pred + r)
    this.x = x_pred + deScale(k * (price - x_pred))
    this.p = deScale((scale(1) - k) * p_pred)

    return { price: this.x, x: prevX, p: prevP }
  }
}
