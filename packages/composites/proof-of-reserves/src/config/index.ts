import { DefaultConfig, Requester, util } from '@chainlink/ea-bootstrap'
import {
  adapterNamesV2 as BalanceAdaptersV2,
  adapterNamesV3 as BalanceAdaptersV3,
  ETHEREUM_CL_INDEXER,
} from '../utils/balance'
import {
  LIST_ADAPTER,
  adapterNamesV2 as ProtocolAdaptersV2,
  adapterNamesV3 as ProtocolAdaptersV3,
} from '../utils/protocol'

export interface Config extends DefaultConfig {
  options: Options
}

export const NAME = 'PROOF_OF_RESERVES'
export const DEFAULT_ENDPOINT = 'reserves'

export const makeConfig = (prefix?: string): Config => ({
  ...Requester.getDefaultConfig(prefix),
  defaultEndpoint: DEFAULT_ENDPOINT,
  options: makeOptions(),
})

export type Options = {
  protocol: string[]
  indexer: string[]
}

export const makeOptions = (): Options => {
  const options: Options = {
    protocol: [],
    indexer: [],
  }
  for (const a of Object.values(ProtocolAdaptersV2)) {
    const url = util.getURL(a)
    if (url) {
      options.protocol.push(a)
      options.protocol.push(a.toLowerCase())
    }
  }
  for (const a of Object.values(ProtocolAdaptersV3)) {
    const url = util.getURL(a)
    if (url) {
      options.protocol.push(a)
      options.protocol.push(a.toLowerCase())
    }
  }
  for (const a of Object.values(BalanceAdaptersV2)) {
    const url = util.getURL(a)
    if (url) {
      options.indexer.push(a)
      options.indexer.push(a.toLowerCase())
    }
  }
  for (const a of Object.values(BalanceAdaptersV3)) {
    const url = util.getURL(a)
    if (url) {
      options.indexer.push(a)
      options.indexer.push(a.toLowerCase())
    }
  }
  options.protocol.push(LIST_ADAPTER)
  options.protocol.push(LIST_ADAPTER.toLowerCase())
  options.indexer.push(ETHEREUM_CL_INDEXER)
  options.indexer.push(ETHEREUM_CL_INDEXER.toLowerCase())
  return options
}
