import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'
import { adapters as BalanceAdapters, Indexer } from '../utils/balance'
import { adapters as ProtocolAdapters, LIST_ADAPTER, Protocol } from '../utils/protocol'

export const DEFAULT_CONFIRMATIONS = 6

export const NAME = 'PROOF_OF_RESERVES'
export const DEFAULT_ENDPOINT = 'reserves'

export const makeConfig = (prefix?: string): Config => ({
  ...Requester.getDefaultConfig(prefix),
  defaultEndpoint: DEFAULT_ENDPOINT,
})

export type Options = {
  protocol: Protocol[]
  indexer: Indexer[]
}

export const makeOptions = (): Options => {
  const options: Options = {
    protocol: [],
    indexer: [],
  }
  for (const a of ProtocolAdapters) {
    const url = util.getURL(a.NAME)
    if (url) {
      options.protocol.push(a.NAME)
      options.protocol.push(a.NAME.toLowerCase())
    }
    options.protocol.push(LIST_ADAPTER)
    options.protocol.push(LIST_ADAPTER.toLowerCase())
  }
  for (const a of BalanceAdapters) {
    const url = util.getURL(a.NAME)
    if (url) {
      options.indexer.push(a.NAME)
      options.indexer.push(a.NAME.toLowerCase())
    }
  }
  return options
}
