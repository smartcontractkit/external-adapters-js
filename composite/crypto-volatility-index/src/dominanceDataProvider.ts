import * as TokenAllocation from '@chainlink/token-allocation-adapter'
import { Execute } from '@chainlink/types'

export const getDominanceAdapter = (): Execute => {
  const config = TokenAllocation.makeConfig('DOMINANCE')
  config.defaultMethod = 'marketCap'
  return TokenAllocation.makeExecute(config)
}

export const dominanceByCurrency = (
  response: Record<string, any>,
  quote: string,
): Record<string, number> => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { result, payload } = response
  return Object.fromEntries(
    Object.entries(payload).map(([symbol, data]) => {
      const marketCap = (data as any).quote[quote].marketCap
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return [symbol, marketCap! / result]
    }),
  )
}
