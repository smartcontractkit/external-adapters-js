import { parseUnits } from 'ethers'

export const PRECISION = 18 // Keep 18 decimals when converting number to bigint

export const scale = (number: number) => parseUnits(number.toFixed(PRECISION), PRECISION)
export const deScale = (bigint: bigint) => bigint / 10n ** BigInt(PRECISION)
