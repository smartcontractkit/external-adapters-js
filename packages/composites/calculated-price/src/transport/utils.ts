import Decimal from 'decimal.js'
import { config } from '../config'

export const calculateMedian = (values: Decimal[]): Decimal => {
  if (values.length === 0) {
    throw new Error('Cannot calculate median of empty array')
  }

  const sortedValues = [...values].sort((a, b) => a.comparedTo(b))
  const middleIndex = Math.floor(sortedValues.length / 2)

  if (sortedValues.length % 2 === 0) {
    return sortedValues[middleIndex - 1].add(sortedValues[middleIndex]).div(2)
  } else {
    return sortedValues[middleIndex]
  }
}

export const getOperandSourceUrls = (sources: string[], settings: typeof config.settings) => {
  return sources
    .map((source) => settings.SOURCE_ADAPTER_URL.get(source))
    .filter((url) => url) as string[]
}
