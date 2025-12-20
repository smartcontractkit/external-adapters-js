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
  private numerators: bigint[]
  private denominator: bigint
  private windowSize: number

  constructor(windowSize: number, polyOrder: number) {
    if (windowSize % 2 === 0) throw new Error('Window size must be odd')
    if (polyOrder !== 2)
      throw new Error('Closed-form implementation currently supports quadratic (p=2) only')

    this.windowSize = windowSize
    const { numerators, denominator } = this.computeCausalQuadraticCoefficients(windowSize)
    this.numerators = numerators
    this.denominator = denominator
  }

  /**
   * Computes coefficients using the closed-form solution for least-squares
   * quadratic polynomial fitting.
   * Formula: w_j = [3*(3k^2 + 3k - 1 - 5j^2)] / [(2k-1)(2k+1)(2k+3)]
   */
  private computeCausalQuadraticCoefficients(m: number): {
    numerators: bigint[]
    denominator: bigint
  } {
    const k = Math.floor(m / 2)
    const n = m
    const s2 = (k * (k + 1) * (2 * k + 1)) / 3
    const s4 = (k * (k + 1) * (2 * k + 1) * (3 * k * k + 3 * k - 1)) / 15

    const commonDenom = BigInt(s2) * BigInt(n * s4 - s2 * s2)
    const numerators: bigint[] = []

    for (let j = -k; j <= k; j++) {
      const term1 = BigInt(s2) * BigInt(s4 - s2 * k * k + (n * k * k - s2) * j * j)
      const term2 = BigInt(k * j) * BigInt(n * s4 - s2 * s2)
      numerators.push(term1 + term2)
    }

    return { numerators, denominator: commonDenom }
  }

  public smooth(window: bigint[]): bigint {
    if (window.length !== this.windowSize) {
      throw new Error(`Buffer must be size ${this.windowSize}`)
    }
    // Convolution: sum(w_i * x_i) using integer math for perfect precision
    const sum = window.reduce((acc, price, i) => {
      return acc + price * this.numerators[i]
    }, 0n)

    return sum / this.denominator
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
    // Use integer math for blending to avoid precision loss
    const precision = BigInt(CONFIG.PRECISION)
    const multiplier = 10n ** precision
    const wBI = parseUnits(w.toFixed(CONFIG.PRECISION), CONFIG.PRECISION)
    const oneMinusWBI = parseUnits((1 - w).toFixed(CONFIG.PRECISION), CONFIG.PRECISION)

    return (smoothedPrice * wBI + rawPrice * oneMinusWBI) / multiplier
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
