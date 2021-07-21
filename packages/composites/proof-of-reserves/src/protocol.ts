import { AdapterImplementation, Config, AdapterResponse, AdapterContext } from '@chainlink/types'
import { Requester } from '@chainlink/ea-bootstrap'
import { callAdapter, makeRequestFactory } from './adapter'
// protocol adapters
import renVM from '@chainlink/renvm-address-set-adapter'
import wBTC from '@chainlink/wbtc-address-set-adapter'

export const LIST_ADAPTER = 'LIST'

export const adapters: AdapterImplementation[] = [wBTC, renVM]

export type Protocol = typeof adapters[number]['NAME']

// Get address set for protocol
export const runProtocolAdapter = async (
  jobRunID: string,
  context: AdapterContext,
  protocol: Protocol,
  data: any,
  config: Config,
): Promise<AdapterResponse> => {
  if (protocol === LIST_ADAPTER) return listAdapter(jobRunID, data)

  const execute = makeRequestFactory(config, protocol)
  const next = {
    id: jobRunID,
    data,
  }
  return callAdapter(execute, context, next, '_onProtocol')
}

const listAdapter = (jobRunID: string, data: any) => {
  if (!('addresses' in data)) {
    throw Error(`Missing "addresses" in request data`)
  }

  const result = data.addresses.map((address: string) => ({ address }))
  return Requester.success(jobRunID, { data: { result } })
}
