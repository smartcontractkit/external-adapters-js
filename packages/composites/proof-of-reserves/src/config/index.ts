import { Requester, util } from '@chainlink/ea-bootstrap'
import { DefaultConfig } from '@chainlink/ea-bootstrap'
import { adaptersV2 as BalanceAdaptersV2, adaptersV3 as BalanceAdaptersV3 } from '../utils/balance'
import {
  adaptersV2 as ProtocolAdaptersV2,
  adaptersV3 as ProtocolAdaptersV3,
  LIST_ADAPTER,
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
  for (const a of ProtocolAdaptersV2) {
    const url = util.getURL(a.NAME)
    if (url) {
      options.protocol.push(a.NAME)
      options.protocol.push(a.NAME.toLowerCase())
    }
  }
  for (const a of ProtocolAdaptersV3) {
    const url = util.getURL(a.name)
    if (url) {
      options.protocol.push(a.name)
      options.protocol.push(a.name.toLowerCase())
    }
  }
  for (const a of BalanceAdaptersV2) {
    const url = util.getURL(a.NAME)
    if (url) {
      options.indexer.push(a.NAME)
      options.indexer.push(a.NAME.toLowerCase())
    }
  }
  for (const a of BalanceAdaptersV3) {
    const url = util.getURL(a.name)
    if (url) {
      options.indexer.push(a.name)
      options.indexer.push(a.name.toLowerCase())
    }
  }
  options.protocol.push(LIST_ADAPTER)
  options.protocol.push(LIST_ADAPTER.toLowerCase())
  return options
}
