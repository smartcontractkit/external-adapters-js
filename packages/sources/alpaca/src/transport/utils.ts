import Decimal from 'decimal.js'

export const isNonNegativeNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0

// Doc wind_down_frames: a zero price is absent, so mid is the non-zero side. Both sides zero has no
// mid (undefined), so the frame is dropped.
export const computeMidPrice = (bp: number, ap: number): number | undefined => {
  if (bp === 0 && ap === 0) {
    return undefined
  }
  if (bp === 0) {
    return ap
  }
  if (ap === 0) {
    return bp
  }
  return new Decimal(bp).plus(ap).div(2).toNumber()
}
