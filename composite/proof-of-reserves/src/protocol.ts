import { AdapterImplementation, Config } from '@chainlink/types'
import { callAdapter, makeRequestFactory } from './adapter'
// protocol adapters
import renVM from '@chainlink/renvm-address-set-adapter'
import wBTC from '@chainlink/wbtc-address-set-adapter'

export const adapters: AdapterImplementation[] = [wBTC, renVM]

export type Protocol = typeof adapters[number]['NAME']

// Get address set for protocol
export const runProtocolAdapter = async (
  jobRunID: string,
  protocol: Protocol,
  data: any,
  config: Config,
) => {
  const execute = makeRequestFactory(config, protocol)
  const next = {
    id: jobRunID,
    data,
  }
  return callAdapter(execute, next, '_onProtocol')
}
