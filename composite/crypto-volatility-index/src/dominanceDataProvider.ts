import * as TokenAllocation from '@chainlink/token-allocation-adapter'
import { Execute } from '@chainlink/types'
import { Response } from '@chainlink/token-allocation-adapter/dist/types'

export const getDominanceAdapter = (): Execute => {
  return TokenAllocation.makeExecute(TokenAllocation.makeConfig())
}

export const dominanceByCurrency = (result: Response, quote: string): Record<string, number> => {
  return Object.fromEntries(
    Object.keys(result.allocations).map((symbol) => {
      const allocation = result.allocations[symbol]
      const marketcap = allocation.quote[quote].marketcap
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return [symbol, marketcap! / result.result]
    }),
  )
}
