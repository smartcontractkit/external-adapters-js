import { IndexResult, makeExecute } from '@chainlink/token-allocation-adapter/dist/adapter'
import { makeConfig } from '@chainlink/token-allocation-adapter/src/config'
import { Execute } from '@chainlink/types'

export const getDominanceAdapter = (): Execute => {
  return makeExecute(makeConfig())
}

export const dominanceByCurrency = (result: IndexResult): Record<string, number> => {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return Object.fromEntries(result.index.map((it) => [it.currency, it.marketcap! / result.total]))
}

Object.fromEntries = (arr: never) => Object.assign({}, ...Array.from(arr, ([k, v]) => ({ [k]: v })))
