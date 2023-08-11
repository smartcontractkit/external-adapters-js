import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'

const GWEI_DIVISOR = 1_000_000_000

export const DEPOSIT_EVENT_TOPIC =
  '0x649bbc62d0e31342afea4e5cd82d4049e7e1ee912fc0889aa790803be39038c5'
export const DEPOSIT_EVENT_LOOKBACK_WINDOW = 10_000

// Value must be in wei
export function formatValueInGwei(value: BigNumber): string {
  return value.div(GWEI_DIVISOR).toString()
}

export const parseLittleEndian = (value: string): BigNumber => {
  const result = []
  let start = value.length - 2
  while (start >= 2) {
    result.push(value.substring(start, start + 2))
    start -= 2
  }
  const convertDecimal = BigNumber(`0x${result.join('')}`)
  return BigNumber(ethers.utils.parseUnits(convertDecimal.toString(), 'gwei').toString())
}
