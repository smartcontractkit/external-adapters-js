import { parseUnits } from 'ethers'

const CONFIG = {
  SAVGOL: {
    WINDOW_SIZE: 23,
    POLY_ORDER: 2, // Quadratic
  },
  TRANSITION: {
    WINDOW_BEFORE: 10, // seconds
    WINDOW_AFTER: 60, // seconds
  },
  PRECISION: 18, // Keep 18 decimals when converting number to bigint
}

/**
 * Savitzky-Golay Filter Implementation
 *
 * A non-parametric smoother that fits local polynomials to preserve signal features.
 * This implementation uses the closed-form solution for quadratic polynomials (p=2),
 * avoiding the need for matrix inversion libraries.
 */
class SavitzkyGolayFilter {
  private coefficients: number[]
  private windowSize: number

  constructor(windowSize: number, polyOrder: number) {
    if (windowSize % 2 === 0) throw new Error('Window size must be odd')
    if (polyOrder !== 2)
      throw new Error('Closed-form implementation currently supports quadratic (p=2) only')

    this.windowSize = windowSize
    this.coefficients = this.computeQuadraticCoefficients(windowSize)
  }

  /**
   * Computes coefficients using the closed-form solution for least-squares
   * quadratic polynomial fitting.
   * Formula: w_j = [3*(3k^2 + 3k - 1 - 5j^2)] / [(2k-1)(2k+1)(2k+3)]
   */
  private computeQuadraticCoefficients(m: number): number[] {
    const k = Math.floor(m / 2)
    const coeffs: number[] = []

    // Denominator term
    const norm = (2 * k - 1) * (2 * k + 1) * (2 * k + 3)

    for (let j = -k; j <= k; j++) {
      // Numerator term
      const term = 3 * (3 * k * k + 3 * k - 1 - 5 * j * j)
      coeffs.push(term / norm)
    }

    return coeffs
  }

  public smooth(window: bigint[]): bigint {
    if (window.length !== this.windowSize) {
      throw new Error(`Buffer must be size ${this.windowSize}`)
    }
    // Convolution: sum(w_i * x_i)
    const sum = window.reduce((sum, price, i) => {
      return sum + numberTimesBigInt(price, this.coefficients[i])
    }, 0n)
    return sum
  }
}

/**
 * Session Aware Smoother
 *
 * Manages the transition state and applies the weighted blending
 * between raw and smoothed prices.
 */
export class SessionAwareSmoother {
  private sgFilter: SavitzkyGolayFilter
  private priceBuffer: bigint[] = []

  constructor() {
    this.sgFilter = new SavitzkyGolayFilter(CONFIG.SAVGOL.WINDOW_SIZE, CONFIG.SAVGOL.POLY_ORDER)
  }

  /**
   * Process a new price update
   * @param rawPrice The current raw median price
   * @param secondsFromTransition Seconds relative to session boundary (-ve before, +ve after)
   */
  public processUpdate(rawPrice: bigint, secondsFromTransition: number): bigint {
    // Update rolling buffer
    this.priceBuffer.push(rawPrice)
    if (this.priceBuffer.length > CONFIG.SAVGOL.WINDOW_SIZE) {
      this.priceBuffer.shift()
    }

    // Calculate blending weight
    const w = this.calculateTransitionWeight(secondsFromTransition)

    // Optimization: If outside transition window (w=0), return raw price
    // However, we must still maintain the buffer for the filter
    if (w <= 0.001) {
      return rawPrice
    }

    // Ensure we have enough data for the filter
    if (this.priceBuffer.length < CONFIG.SAVGOL.WINDOW_SIZE) {
      // Fallback for insufficient history (e.g., at very start of stream)
      return rawPrice
    }

    // Calculate smoothed price
    const smoothedPrice = this.sgFilter.smooth(this.priceBuffer)

    // Apply blending: price_output = smoothed * w  + raw * (1 - w)
    return numberTimesBigInt(smoothedPrice, w) + numberTimesBigInt(rawPrice, 1 - w)
  }

  /**
   * Calculates the raised cosine decay weight
   */
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

const numberTimesBigInt = (bigint: bigint, number: number) =>
  (bigint * parseUnits(number.toFixed(CONFIG.PRECISION), CONFIG.PRECISION)) /
  10n ** BigInt(CONFIG.PRECISION)
