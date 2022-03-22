import { AdapterImplementation, Config, AdapterResponse, AdapterContext } from '@chainlink/types'
import { Requester } from '@chainlink/ea-bootstrap'
import { callAdapter, makeRequestFactory } from '../endpoint/reserves'
// protocol adapters
import * as renVM from '@chainlink/renvm-address-set-adapter'
import * as wBTC from '@chainlink/wbtc-address-set-adapter'
import * as Gemini from '@chainlink/gemini-adapter'
import * as chainReserveWallets from '@chainlink/chain-reserve-wallet-adapter'
import * as wrapped from '@chainlink/wrapped-adapter'

export const LIST_ADAPTER = 'LIST'

export const adapters: AdapterImplementation[] = [wBTC, renVM, Gemini, chainReserveWallets, wrapped]

export type Protocol = typeof adapters[number]['NAME']

// Get address set for protocol
export const runProtocolAdapter = async (
  jobRunID: string,
  context: AdapterContext,
  protocol: Protocol,
  data: { token: string; chainId: string; network: string } | { addresses: string[] },
  config: Config,
): Promise<AdapterResponse> => {
  if (protocol === LIST_ADAPTER) return listAdapter(jobRunID, data as { addresses: string[] })

  const execute = makeRequestFactory(config, protocol)
  const next = {
    id: jobRunID,
    data,
  }
  return callAdapter(execute, context, next, '_onProtocol')
}

const listAdapter = (jobRunID: string, data: { addresses: string[] }) => {
  if (!('addresses' in data)) {
    throw Error(`Missing "addresses" in request data`)
  }

  const result = data.addresses.map((address: string) => ({ address }))
  return Requester.success(jobRunID, { data: { result } })
}
