import * as TokenAllocation from '@chainlink/token-allocation-adapter'
import { Execute } from '@chainlink/types'

export const getDominanceAdapter = (): Execute => {
  const config = TokenAllocation.makeConfig()
  config.defaultMethod = 'marketCap'
  return TokenAllocation.makeExecute(config)
}

export const dominanceByCurrency = (
  response: {
    result: number
    payload: Record<string, { quote: Record<string, { marketCap: number }> }>
  },
  quote: string,
): Record<string, number> => {
  const { result, payload } = response
  return Object.fromEntries(
    Object.entries(payload).map(([symbol, data]) => {
      const marketCap = data.quote[quote].marketCap
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return [symbol, marketCap! / result]
    }),
  )
}
