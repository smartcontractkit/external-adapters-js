import Decimal from 'decimal.js'

export const calculateMedian = (values: number[]): Decimal => {
  if (values.length === 0) {
    throw new Error('Cannot calculate median of empty array')
  }

  const sortedValues = [...values].sort((a, b) => a - b)
  const middleIndex = Math.floor(sortedValues.length / 2)

  if (sortedValues.length % 2 === 0) {
    return new Decimal(sortedValues[middleIndex - 1]).add(sortedValues[middleIndex]).div(2)
  } else {
    return new Decimal(sortedValues[middleIndex])
  }
}

export const getOperandSourceUrls = (sources: string[]) => {
  return sources
    .map((source) => process.env[`${source.toUpperCase()}_ADAPTER_URL`])
    .filter((url) => url) as string[]
}
