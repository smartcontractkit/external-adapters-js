import { AdapterImplementation, Config, AdapterResponse, AdapterContext } from '@chainlink/types'
import { Requester } from '@chainlink/ea-bootstrap'
import { makeRequestFactory, callAdapter } from '.'

// protocol adapters
import * as renVM from '@chainlink/renvm-address-set-adapter'
import * as wBTC from '@chainlink/wbtc-address-set-adapter'
import * as Gemini from '@chainlink/gemini-adapter'
import * as celsiusAddressList from '@chainlink/celsius-address-list-adapter'
import * as chainReserveWallets from '@chainlink/chain-reserve-wallet-adapter'
import * as wrapped from '@chainlink/wrapped-adapter'

export const LIST_ADAPTER = 'LIST'

export const adapters: AdapterImplementation[] = [
  wBTC,
  renVM,
  Gemini,
  celsiusAddressList,
  chainReserveWallets,
  wrapped,
]

export type Protocol = typeof adapters[number]['NAME']

type AddressData =
  | { token: string; chainId: string; network: string }
  | { addresses: string[]; chainId: string; network: string }
  | { addresses: AddressObject[] }

type AddressObject = { address: string; network: string; chainId: string }

// Get address set for protocol
export const runProtocolAdapter = async (
  jobRunID: string,
  context: AdapterContext,
  protocol: Protocol,
  data: AddressData,
  config: Config,
): Promise<AdapterResponse> => {
  if (protocol === LIST_ADAPTER)
    return listAdapter(
      jobRunID,
      data as { addresses: AddressList; chainId?: string; network?: string },
    )

  const execute = makeRequestFactory(config, protocol)
  const next = {
    id: jobRunID,
    data,
  }
  return callAdapter(execute, context, next, '_onProtocol')
}

const listAdapter = (
  jobRunID: string,
  data: { addresses: AddressList; chainId?: string; network?: string },
) => {
  if (!('addresses' in data)) {
    throw Error(`Missing "addresses" in request data`)
  }
  if (typeof data.addresses[0] === 'string') {
    const result = (data.addresses as string[]).map((address: string) => ({
      address,
      network: data.network,
      chainId: data.chainId,
    }))
    return Requester.success(jobRunID, { data: { result } })
  }
  if (typeof data.addresses[0] === 'object') {
    const result = (data.addresses as AddressObject[]).map(({ address, network, chainId }) => {
      if (!address) throw Error('Missing address parameter in one of the provided address objects.')
      const addressObject: AddressObject = { address }
      addressObject.network = network || data.network
      addressObject.chainId = chainId || data.chainId
      return addressObject
    })
    return Requester.success(jobRunID, { data: { result } })
  }
  throw Error('Invalid data received for list addresses parameter')
}
