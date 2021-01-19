import { IndexResult } from '@chainlink/token-allocation-adapter/dist/adapter'
import * as TokenAllocation from '@chainlink/token-allocation-adapter'
import { Execute } from '@chainlink/types'

export const getDominanceAdapter = (): Execute => {
  return TokenAllocation.makeExecute(TokenAllocation.makeConfig())
}

export const dominanceByCurrency = (result: IndexResult): Record<string, number> => {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return Object.fromEntries(result.index.map((it) => [it.currency, it.marketcap! / result.total]))
}
