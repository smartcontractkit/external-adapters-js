// Algorithm by @kalanyuz and @eshaqiri
import { parseUnits } from 'ethers'
import { deScale, PRECISION, scale } from './utils'

const CONFIG = {
  ALPHA: parseUnits('0.095', PRECISION),
}

// Exponential Moving Average
export class EmaFilter {
  private x = -1n

  public smooth(price: bigint) {
    const prevX = this.x

    if (this.x < 0n) {
      this.x = price
    } else {
      this.x = deScale(CONFIG.ALPHA * price + (scale(1) - CONFIG.ALPHA) * this.x)
    }

    return { price: this.x, x: prevX, p: 0n }
  }
}
