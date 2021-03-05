import { Requester } from '@chainlink/external-adapter'
import { Config } from '@chainlink/types'
import { adapters as ProtocolAdapters, Protocol } from './protocol'
import { adapters as BalanceAdapters, Indexer } from './balance'
import { util } from '@chainlink/ea-bootstrap'

export const makeConfig = (prefix?: string): Config => Requester.getDefaultConfig(prefix)

export const ENV_DATA_PROVIDER_URL = 'DATA_PROVIDER_URL'

export const getURL = (prefix: string, required = false) =>
  required
    ? util.getRequiredEnv(ENV_DATA_PROVIDER_URL, prefix)
    : util.getEnv(ENV_DATA_PROVIDER_URL, prefix)

export const makeOptions = () => {
  const options = {
    protocol: [] as Protocol[],
    indexer: [] as Indexer[],
  }
  for (const a of ProtocolAdapters) {
    const url = getURL(a.NAME)
    if (url) options.protocol.push(a.NAME)
  }
  for (const a of BalanceAdapters) {
    const url = getURL(a.NAME)
    if (url) options.indexer.push(a.NAME)
  }
  return options
}
