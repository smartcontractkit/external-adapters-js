import {
  AdapterContext,
  AdapterImplementation as v2AdapterImplementation,
  AdapterResponse,
  Config,
  Requester,
} from '@chainlink/ea-bootstrap'
import { callAdapter, makeRequestFactory } from '.'

// protocol adapters
import * as celsiusAddressList from '@chainlink/celsius-address-list-adapter'
import * as chainReserveWallets from '@chainlink/chain-reserve-wallet-adapter'
import { Adapter as v3AdapterImplementation } from '@chainlink/external-adapter-framework/adapter'
import { adapter as gemini } from '@chainlink/gemini-adapter'
import { adapter as moonbeamAddressList } from '@chainlink/moonbeam-address-list-adapter'
import { adapter as porAddressList } from '@chainlink/por-address-list-adapter'
import * as renVM from '@chainlink/renvm-address-set-adapter'
import { adapter as staderList } from '@chainlink/stader-address-list-adapter'
import * as swellList from '@chainlink/swell-address-list-adapter'
import { adapter as wBTC } from '@chainlink/wbtc-address-set-adapter'
import * as wrapped from '@chainlink/wrapped-adapter'
import { adapter as coinbasePrime } from '@chainlink/coinbase-prime-adapter'

export const LIST_ADAPTER = 'LIST'

// TODO: consistent package exports
export const adaptersV2: v2AdapterImplementation[] = [
  renVM as unknown as v2AdapterImplementation,
  celsiusAddressList as unknown as v2AdapterImplementation,
  chainReserveWallets as unknown as v2AdapterImplementation,
  wrapped as unknown as v2AdapterImplementation,
  swellList as unknown as v2AdapterImplementation,
]

export const adaptersV3: v3AdapterImplementation[] = [
  moonbeamAddressList,
  staderList,
  wBTC,
  gemini,
  porAddressList,
  coinbasePrime,
]

type AddressData = { token: string; chainId: string; network: string } | AddressList

type AddressList =
  | { addresses: string[]; chainId: string; network: string }
  | { addresses: AddressObject[] }

type AddressObject = { address: string; network: string; chainId: string }

// Get address set for protocol
export const runProtocolAdapter = async (
  jobRunID: string,
  context: AdapterContext,
  protocol: string,
  data: AddressData,
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

const listAdapter = (jobRunID: string, data: AddressData) => {
  if (!('addresses' in data)) {
    throw Error(`Missing "addresses" in request data`)
  }
  if ((data.addresses as string[]).every((address: string) => typeof address === 'string')) {
    const result = (data.addresses as string[]).map((address: string) => ({
      address,
      network: (data as { addresses: string[]; chainId: string; network: string }).network,
      chainId: (data as { addresses: string[]; chainId: string; network: string }).chainId,
    }))
    return Requester.success(jobRunID, { data: { result } })
  }
  if (
    (data.addresses as AddressObject[]).every(
      ({ address, chainId, network }: AddressObject) =>
        typeof address === 'string' && typeof chainId === 'string' && typeof network === 'string',
    )
  ) {
    return Requester.success(jobRunID, { data: { result: data.addresses } })
  }
  throw Error('Invalid data received for list addresses parameter')
}
